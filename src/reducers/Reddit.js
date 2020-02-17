const initialState = {
    redditTitles: [],
    submittedElements: [],
    albumPhotos: [],
    userError: ""
}

export default function Reddit(state = initialState, action) {
    switch (action.type) {

        case 'SET_REDDIT_TITLES': {

            return {
                ...state,
                redditTitles: action.redditTitles
            }
        }

        case 'SET_SUBMITTED_ELEMENTS': {

            return {
                ...state,
                submittedElements: action.submittedElements
            }
        }

        case 'SET_ALBUM_PHOTOS': {

            return {
                ...state,
                albumPhotos: action.albumPhotos
            }
        }

        case 'USER_DOES_NOT_EXIST': {

            return {
                ...state,
                userError: action.userError
            }
        }

        default:
            return state
    }
}