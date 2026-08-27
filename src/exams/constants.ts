export const EXAM_TYPES = ['ACADEMIC', 'GENERAL'] as const;
export type ExamKind = (typeof EXAM_TYPES)[number];

export const SECTION_TYPES = ['LISTENING', 'READING', 'WRITING'] as const;
export type SectionKind = (typeof SECTION_TYPES)[number];

export const QUESTION_TYPES = [
    'MCQ',                   // один вариант из options
    'MULTIPLE_ANSWER',       // несколько вариантов из options, ответы через |
    'TRUE_FALSE_NOT_GIVEN',  // reading
    'YES_NO_NOT_GIVEN',      // reading
    'MATCHING',              // сопоставление с вариантом из options
    'GAP_FILL',              // вписать слово: sentence/note/table/form/summary completion
    'SHORT_ANSWER',          // ответ своими словами в 1-3 слова
    'LABELLING',             // подписать карту, план, диаграмму
    'ESSAY',                 // writing task 1 и task 2
] as const;
export type QuestionKind = (typeof QUESTION_TYPES)[number];

// этим типам нужен список вариантов
export const OPTION_BASED: readonly QuestionKind[] = [
    'MCQ', 'MULTIPLE_ANSWER', 'TRUE_FALSE_NOT_GIVEN', 'YES_NO_NOT_GIVEN', 'MATCHING', 'LABELLING',
];

// у этих типов варианты всегда одни и те же - подставляем сами
export const FIXED_OPTIONS: Partial<Record<QuestionKind, string[]>> = {
    TRUE_FALSE_NOT_GIVEN: ['TRUE', 'FALSE', 'NOT GIVEN'],
    YES_NO_NOT_GIVEN: ['YES', 'NO', 'NOT GIVEN'],
};

export const ATTEMPT_STATUSES = [
    'IN_PROGRESS',    // попытка идёт
    'COMPLETED',      // сдана, ждёт проверки
    'SCORING',        // воркер считает баллы
    'SCORED',         // готово, смотри scores
    'SCORING_FAILED', // проверка упала, scores не будет
] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];
