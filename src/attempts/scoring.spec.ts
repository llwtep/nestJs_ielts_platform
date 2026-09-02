import {
    countWords,
    isAnswerCorrect,
    normalizeAnswer,
    overallBand,
    parseWritingScore,
    rawToBand,
    underLengthCap,
    writingBand,
} from './scoring';

// длинный ответ, чтобы штраф за объём не срабатывал
const FULL_LENGTH = 300;

describe('scoring', () => {
    it('normalizes articles, case, punctuation and spacing', () => {
        expect(normalizeAnswer('  The   Doctor. ')).toBe('doctor');
        expect(isAnswerCorrect('a doctor', 'doctor')).toBe(true);
        expect(isAnswerCorrect('T', 'TRUE|T')).toBe(true);
        expect(isAnswerCorrect('nurse', 'doctor')).toBe(false);
        expect(isAnswerCorrect('   ', 'doctor')).toBe(false);
    });

    it('uses different tables per section and exam type', () => {
        expect(rawToBand(30, 40, 'LISTENING', 'ACADEMIC')).toBe(7.0);
        expect(rawToBand(30, 40, 'READING', 'ACADEMIC')).toBe(7.0);
        expect(rawToBand(30, 40, 'READING', 'GENERAL')).toBe(6.0);
    });

    it('scales short sections to the 40-question tables', () => {
        // 8 из 10 == 32 из 40
        expect(rawToBand(8, 10, 'LISTENING', 'ACADEMIC')).toBe(7.5);
        expect(rawToBand(0, 10, 'LISTENING', 'ACADEMIC')).toBe(0);
        expect(rawToBand(0, 0, 'LISTENING', 'ACADEMIC')).toBe(0);
    });

    it('weights writing task 2 twice', () => {
        const task = (task: number, band: number) => ({
            task, band, taskResponse: band, coherence: band, lexical: band, grammar: band, feedback: '',
        });
        expect(writingBand([task(1, 6), task(2, 7.5)])).toBe(7.0);
        expect(writingBand([task(2, 6.5)])).toBe(6.5);
        expect(writingBand([])).toBeUndefined();
    });

    it('rounds overall to the nearest half band', () => {
        expect(overallBand([6, 6.5, 7])).toBe(6.5);
        expect(overallBand([6, 6, 6.5])).toBe(6.0); // 6.166
        expect(overallBand([6, 6.5, 6.5, 6])).toBe(6.5); // 6.25 округляется вверх
        expect(overallBand([6.5, 7, 7, 7])).toBe(7.0); // 6.875
        expect(overallBand([])).toBeUndefined();
    });

    it('clamps and recomputes the band the model returns', () => {
        const score = parseWritingScore(
            { band: 11, taskResponse: 7, coherence: 6, lexical: 6, grammar: 20, feedback: 42 },
            2,
            FULL_LENGTH,
        );
        expect(score.grammar).toBe(9);
        expect(score.band).toBe(7.0);
        expect(score.feedback).toBe('');
        expect(() => parseWritingScore({ taskResponse: 'nope' }, 1, FULL_LENGTH)).toThrow();
    });

    it('counts words and caps under-length responses', () => {
        expect(countWords('  There  no charts, i dont know bruh ')).toBe(7);
        expect(countWords('   ')).toBe(0);

        // 7 слов против минимума 150 для Task 1
        expect(underLengthCap(7, 1)).toBe(1);
        expect(underLengthCap(40, 1)).toBe(3);
        expect(underLengthCap(100, 1)).toBe(5);
        expect(underLengthCap(160, 1)).toBe(9);
        // у Task 2 минимум выше, те же 160 слов уже недобор
        expect(underLengthCap(160, 2)).toBe(5);
    });

    it('does not let the model reward a seven-word essay', () => {
        const generous = { taskResponse: 5, coherence: 5, lexical: 5, grammar: 5, feedback: 'ok' };
        expect(parseWritingScore(generous, 1, FULL_LENGTH).band).toBe(5);

        const capped = parseWritingScore(generous, 1, 7);
        expect(capped.band).toBe(1);
        expect(capped.feedback).toContain('7 words against a 150-word minimum');
    });
});