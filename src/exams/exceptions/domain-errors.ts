export class ExamNotFoundError extends Error{
    constructor(examId:number){
        super(`Exam with ID ${examId} was not found`);
        this.name='ExamNotFoundError';
    }
}