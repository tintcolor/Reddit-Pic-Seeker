import axios from 'axios';


export const FETCH_USER_SUBMITTED_POSTS = (user) => {
    return dispatch => {
        return new Promise((resolve, reject) => {

            axios.get('https://www.reddit.com/user/' + user + '/submitted.json?limit=100')

                .then(function (response) {

                    dispatch({
                        type: "SET_SUBMITTED_ELEMENTS",
                        submittedElements: response.data.data.children
                    })
                    console.log("after")
                    resolve(response.data)
                })
                .catch(function (error) {

                    console.log(error)

                    dispatch({
                        type: "USER_DOES_NOT_EXIST",
                        userError: { error: "The user " + user + " does not exist" }
                    })
                    // me.setState({ error: "The user " + user + " does not exist" })
                });
        })
    }
}


export const FETCH_ADDITIONAL_USER_SUBMITTED_POSTS = (user, lastPageId) => {
    return dispatch => {
        return new Promise((resolve, reject) => {

            axios.get('https://www.reddit.com/user/' + user + '/submitted.json?after=' + lastPageId)
                .then(function (response) {
                    resolve(response.data)
                })

                .catch(function (error) {

                });
        })
    }
}