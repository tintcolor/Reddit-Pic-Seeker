import React, { Component } from 'react';
import { render } from 'react-dom';
import RedditTitles from './RedditTitles';
import styles from '../assets/Reddit.css'

class App extends Component {
    render() {
        return (
            <div className="full-height">
                <RedditTitles />
            </div>
        )
    }
}

export default App;
