import { QuestionType } from '@spotify-music-quiz/shared/schema/game';

export function getQuestionTypeLabel(type?: QuestionType | string): string {
  switch (type) {
    case QuestionType.TRACK_NAME:
    case 'TRACK_NAME':
      return 'GUESS TITLE';
    case QuestionType.ARTIST_NAME:
    case 'ARTIST_NAME':
      return 'GUESS ARTIST';
    case 'ALBUM_NAME':
      return 'GUESS ALBUM';
    case 'RELEASE_YEAR':
      return 'GUESS RELEASE YEAR';
    case QuestionType.FILL_IN_THE_GAP:
    case 'FILL_IN_THE_GAP':
      return 'FILL IN THE LYRICS';
    default:
      return 'GUESS THE SONG';
  }
}
