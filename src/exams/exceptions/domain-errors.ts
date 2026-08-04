export class ExamNotFoundError extends Error{
    constructor(examId:string){
        super(`Exam with ID ${examId} was not found`);
        this.name='ExamNotFoundError';
    }
}