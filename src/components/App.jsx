import React, { Component } from 'react';
import { render } from 'react-dom';
import RedditTitles from './RedditTitles';
import styles from '../assets/Reddit.css'
//the hook thing breaks when it's part of a non react function....
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    withRouter ,
    matchPath ,
    useParams
} from "react-router-dom";
class App extends Component {
    render() {
        return (
            <Router >
            <div className="full-height">
                <RedditTitles />
            </div>
            </Router>
        )
    }
}

export default App;
