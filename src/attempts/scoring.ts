export type ExamType = 'ACADEMIC' | 'GENERAL';

export type WritingTaskScore = {
    task: number;
    band: number;
    taskResponse: number;
    coherence: number;
    lexical: number;
    grammar: number;
    feedback: string;
};

export type AttemptScores = {
    listening?: number;
    reading?: number;
    writing?: {
        band: number;
        tasks: WritingTaskScore[];
    };
    overall?: number;
};

// IELTS оперирует половинками балла
export const half = (n: number) => Math.round(n * 2) / 2;

// [минимальный raw score из 40, band]
const LISTENING: [number, number][] = [
    [39, 9.0], [37, 8.5], [35, 8.0], [32, 7.5], [30, 7.0], [26, 6.5], [23, 6.0],
    [18, 5.5], [16, 5.0], [13, 4.5], [10, 4.0], [8, 3.5], [6, 3.0], [4, 2.5],
    [3, 2.0], [1, 1.0], [0, 0],
];

const ACADEMIC_READING: [number, number][] = [
    [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0], [27, 6.5], [23, 6.0],
    [19, 5.5], [15, 5.0], [13, 4.5], [10, 4.0], [8, 3.5], [6, 3.0], [4, 2.5],
    [3, 2.0], [1, 1.0], [0, 0],
];

const GENERAL_READING: [number, number][] = [
    [40, 9.0], [39, 8.5], [37, 8.0], [36, 7.5], [34, 7.0], [32, 6.5], [30, 6.0],
    [27, 5.5], [23, 5.0], [19, 4.5], [15, 4.0], [12, 3.5], [9, 3.0], [6, 2.5],
    [3, 2.0], [1, 1.0], [0, 0],
];

export function normalizeAnswer(text: string) {
    return text
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(a|an|the) /, '');
}

// correctAnswer может держать несколько допустимых вариантов через |
export function isAnswerCorrect(given: string, correct: string) {
    const answer = normalizeAnswer(given);
    if (!answer) return false;
    return correct.split('|').some((variant) => normalizeAnswer(variant) === answer);
}

// таблицы конверсии рассчитаны на 40 вопросов - короткие секции масштабируем
export function rawToBand(
    raw: number,
    total: number,
    section: 'LISTENING' | 'READING',
    examType: ExamType,
) {
    if (total <= 0) return 0;
    const scaled = Math.round((raw / total) * 40);
    const table =
        section === 'LISTENING'
            ? LISTENING
            : examType === 'GENERAL'
              ? GENERAL_READING
              : ACADEMIC_READING;
    for (const [min, band] of table) {
        if (scaled >= min) return band;
    }
    return 0;
}

// Task 2 весит вдвое больше Task 1
export function writingBand(tasks: WritingTaskScore[]) {
    if (tasks.length === 0) return undefined;
    const task1 = tasks.find((t) => t.task === 1);
    const task2 = tasks.find((t) => t.task === 2);
    if (task1 && task2) return half((task1.band + 2 * task2.band) / 3);
    return half(tasks[0].band);
}

export function overallBand(bands: number[]) {
    if (bands.length === 0) return undefined;
    return half(bands.reduce((sum, b) => sum + b, 0) / bands.length);
}

// модели любят вернуть band 11 или строку вместо числа - считаем band сами
export function parseWritingScore(raw: any, task: number): WritingTaskScore {
    const criterion = (value: any) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return null;
        return Math.min(9, Math.max(1, half(n)));
    };
    const taskResponse = criterion(raw?.taskResponse);
    const coherence = criterion(raw?.coherence);
    const lexical = criterion(raw?.lexical);
    const grammar = criterion(raw?.grammar);
    if (taskResponse === null || coherence === null || lexical === null || grammar === null) {
        throw new Error('AI returned incomplete IELTS criteria');
    }
    return {
        task,
        band: half((taskResponse + coherence + lexical + grammar) / 4),
        taskResponse,
        coherence,
        lexical,
        grammar,
        feedback: typeof raw?.feedback === 'string' ? raw.feedback.slice(0, 1000) : '',
    };
}
