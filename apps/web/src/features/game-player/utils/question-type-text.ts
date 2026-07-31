import { QuestionType } from "@spotify-music-quiz/shared/schema/game";

export function getQuestionTypeLabel(questionType: QuestionType) {
    switch (questionType) {
        case QuestionType.FILL_IN_THE_GAP:
            return 'Fill in the Lyrics';
        case QuestionType.ARTIST_NAME:
            return 'Guess the Artist';
        case QuestionType.TRACK_NAME:
            return 'Guess the Song Title';
        default:
            return 'Unknown';
    }
}