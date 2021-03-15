import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { render } from 'react-dom';
import axios from 'axios';
import { connect } from 'react-redux';
import toggleStyles from '../assets/Toggle.css';
import { spreadURL } from './helpers/RedditHelperFunctions'
import { Button, Form, FormGroup, FormControl, Grid, Row, Col, Image, DropdownButton, MenuItem, Carousel, Modal, Checkbox } from 'react-bootstrap';
import Toggle from 'react-toggle';
import PhotoCarousel from './PhotoCarousel';
import PropTypes from 'prop-types';
import { Menu, Item, Sidebar, Segment, Icon, Header, Sticky, Rail, Grid as SemanticGrid, Dimmer, Loader } from 'semantic-ui-react';
import { FETCH_USER_SUBMITTED_POSTS, FETCH_ADDITIONAL_USER_SUBMITTED_POSTS } from '../actions/Reddit'
import _isNil from 'lodash/isNil'
import _get from 'lodash/get'
import _last from 'lodash/last'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    withRouter, matchPath,
    useParams
} from "react-router-dom";



// import BurgerMenu from 'react-burger-menu';//code clean up
//categories
//git uploading
//similar picture removal
// connect to redis to have storage of all added users
// mobile design
//loaders
//with comments, you can match just paratheses first, then you can pull out actual link
// videos, gifs, pics only
//   paratheses
//   actual link   /\(([^)]+)\)/)[1]

//menu slider that has options

//figure out how to paginate and not error out if you're on the last page


class RedditTitles extends Component {

    constructor(props) {
        super(props)

        this.firstSubmission = false;
        this.switchNsfw = React.createRef();

        this.state = {
            user: "",
            photos: [],
            albumPhotos: [],
            photoSet: new Set(),
            error: null,
            nsfw: false,
            onlyNsfw: false,
            num: 3,
            dropDownTitle: "Small",
            renderCarousel: false,
            userList: [],
            displayPics: true,
            displayGifs: false,
            isScrolled: false,
            sidebarOpen: true,
            lastPageId: "",
            visible: false
        }
    }

    componentWillMount() {

        if (Object.keys(localStorage).length !== 0) {
            let newList = [...new Set(!_isNil(localStorage.getItem("userList")) ? localStorage.getItem("userList").split(",") : "")]

            this.setState({
                userList: newList,
                num: !_isNil(Number(localStorage.getItem("gridState"))) ? Number(localStorage.getItem("gridState")) : 0,
                dropDownTitle: !_isNil(localStorage.getItem("gridStateTitle")) ? (localStorage.getItem("gridStateTitle")) : '',
                nsfw: !_isNil(JSON.parse(localStorage.getItem("NSFW"))) ? (JSON.parse(localStorage.getItem("NSFW"))) : false
            })
        }

    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.listenToScroll)
    }

    listenToScroll = () => {
        const winScroll =
            document.body.scrollTop || document.documentElement.scrollTop

        const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight

        const scrolled = winScroll / height

        if (scrolled > 0 && !this.state.isScrolled) {
            console.log(scrolled);
            this.setState({
                isScrolled: scrolled > 0,
            })
        }

        if (scrolled === 0 && this.state.isScrolled) {
            console.log(scrolled);
            this.setState({
                isScrolled: false,
            })
        }
    }

    componentDidMount() {
        window.addEventListener('scroll', this.listenToScroll)
        this.updateURL(this.props.history.location.pathname)
    }

    updateURL=(path)=> {
        debugger
        const match = matchPath(path, {
            path: '/:param',
            exact: true,
            strict: false
        })

        if (match) {
            const id = match.params.param
            this.fetchData(id);

        }
    }

    fetchData = id => {

        this.setState({
            user: id
        })
        this.retrievePhotos(id)
    };

    retrievePhotos = async (urlUser) => {

        let user = this.state.user
        if (!_isNil(urlUser)) {
            this.firstSubmission = true

            user = urlUser
        }
        let response = await this.props.dispatch(FETCH_USER_SUBMITTED_POSTS(user))
        this.retrievePage(_last(response.data.children))
        this.resetLocalState();
        this.createPhotoArray();
        this.setLocalStorage();
        if (!_isNil(urlUser)) {
            this.firstSubmission = true

            this.renderPhotos()
        }


    }

    retrievePage(data) {
        this.setState({
            lastPageId: data.kind + "_" + data.data.id
        })
    }

    retrieveMoreMedia = async () => {


        let response = await this.props.dispatch(FETCH_ADDITIONAL_USER_SUBMITTED_POSTS(this.state.user, this.state.lastPageId))

        this.props.dispatch({
            type: "SET_SUBMITTED_ELEMENTS",
            submittedElements: [...this.props.submittedElements, ...response.data.children]
        })

        this.retrievePage(_last(response.data.children))

        this.createPhotoArray();
    }

    resetLocalState() {
        this.setState({
            error: null,
            photoSet: new Set(),
            photos: []
        })
    }

    setLocalStorage() {
        let list = this.state.userList;
        list.push(this.state.user.toLowerCase())
        var newList = [...new Set(list)]

        this.setState({
            userList: newList
        });

        localStorage.setItem("userList", this.state.userList);
    }


    retrieveAlbumPhotos = (link, endpoint, nsfw) => {
        var me = this;
        axios.get('https://api.imgur.com/3/album/' + endpoint + '/images', {
            headers: { Authorization: "Client-ID " + "ea54318dd4adabc" }
        }).then(function (response) {

            me.props.dispatch({
                type: "SET_ALBUM_PHOTOS",
                albumPhotos: [...response.data.data]
            });


            me.setState({ albumPhotos: me.props.albumPhotos })


            me.addImgurAlbums(link, nsfw);



        }).catch(function (error) {
            console.log(error);
        });
    }

    addImgurAlbums = (link, nsfw) => {
        let photoArray = this.state.photos;

        let set = this.state.photoSet;
        return this.props.albumPhotos.map((field) => {

            let fieldString = set.has(JSON.stringify(field))
            if (!fieldString) {
                photoArray.push({ imageURL: field.link, link: link, nsfw: nsfw })
                set.add(JSON.stringify(field))

                this.setState({ photos: [...photoArray] })
            }
        });
    }




    createPhotoArray = () => {

        return this.props.submittedElements.map((field, index) => {
            let imageURL = field.data.url;
            let link = "http://www.reddit.com" + field.data.permalink;


            if (field.data.domain === "m.imgur.com" ||
                field.data.domain === "i.imgur.com" ||
                field.data.domain === "imgur.com") {

                if (field.data.domain === "imgur.com" || field.data.domain === "m.imgur.com") {
                    if (spreadURL("album", imageURL)) {
                        this.retrieveAlbumPhotos(link, spreadURL("albumRegex", imageURL), field.data.over_18);
                    }
                    else if (spreadURL("gallery", imageURL)) {
                        this.retrieveAlbumPhotos(link, spreadURL("galleryRegex", imageURL), field.data.over_18);
                    }
                    else if (spreadURL("end", imageURL) === "gifv") {
                        this.addPhotosToState(imageURL, link, field.data.over_18);
                    }
                    else {
                        imageURL = imageURL + ".jpg"
                        this.addPhotosToState(imageURL, link, field.data.over_18);
                    }
                } else if (field.data.domain === "i.imgur.com") {
                    this.addPhotosToState(imageURL, link, field.data.over_18);

                } else if (field.data.domain === "m.imgur.com") {
                    imageURL = imageURL + ".jpg"
                    var mobile = imageURL.replace("m.imgur.com", "imgur.com");
                    this.addPhotosToState(mobile, link, field.data.over_18);
                }

            }
            // else if (spreadURL("gfycat", imageURL) === "gfycat") {
            //     debugger
            //     regexStart = spreadURL("start", imageURL) + "mp4"
            //     // photoArray.push({ regexStart, nsfw: field.data.over_18 })
            //     // this.addPhotosToState(photoArray);


            // }
            else if (field.data.domain === "redgifs.com") {
                let userName = imageURL.match(/[a-zA-Z0-9]+$/)

                if (!_isNil(field.data.preview)) {

                    this.addPhotosToState(field.data.preview.reddit_video_preview.fallback_url, link, field.data.over_18);

                }

            }
            else if (field.data.domain === "i.redd.it") {

                this.addPhotosToState(field.data.url, link, field.data.over_18);

            }
            else if (field.data.domain === "v.redd.it") {

                // photoArray.push("Can't display videos");
                // this.setState({ photos: photoArray })

            }

        })
    }



    addPhotosToState(imageURL, link, nsfw) {
        let set = this.state.photoSet;
        let photoArray = this.state.photos;

        let mediaObject = { imageURL: imageURL, link: link, nsfw: nsfw };

        let fieldString = set.has(JSON.stringify(mediaObject))
        if (!fieldString) {
            photoArray.push(mediaObject);
            set.add(JSON.stringify(mediaObject))

            this.setState({
                photoSet: set
            })

            this.setState({ photos: photoArray });
        }
    }


    // addPhotosToState(photoArray) {
    //     var set = this.state.photoSet;
    //     let fieldString = set.has(JSON.stringify(photoArray))
    //     if (!fieldString) {
    //         set.add(JSON.stringify(photoArray))

    //         this.setState({
    //             photoSet: set
    //         })

    //         this.setState({ photos: photoArray });
    //     }
    // }

    handleCheckboxMediaChange = (event) => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    changeURLPerUser = () => {
        this.props.history.push(this.state.user);
    };

    renderMediaCheckbox() {

        let inline = this.state.isScrolled
        return (
            <form>
                <Checkbox
                    inline={inline}
                    name="displayPics"
                    onChange={this.handleCheckboxMediaChange}
                    defaultChecked={this.state.displayPics} >
                    Pics
    </Checkbox>
                <Checkbox
                    inline
                    name="displayGifs"
                    onChange={this.handleCheckboxMediaChange}
                    checked={this.state.displayGifs}>
                    Gifs/Videos
    </Checkbox>
            </form>

        )
    }

    renderGifv(centerImageStyle, link, imageURL, index) {
        return (
            <Col xs={this.state.num} md={this.state.num} key={index}>
                <div style={centerImageStyle} key={index}>
                    <a href={link}>
                        <br />
                        <video
                            preload="auto"
                            // autoPlay="autoplay"
                            controls
                            loop="loop"
                            style={{ maxWidth: 100 + '%' }}
                            src={imageURL} />
                    </a>
                </div>
            </Col>
        )
    }

    calcHeight(value) {
        let numberOfLineBreaks = (value.match(/\n/g) || []).length;
        let newHeight = 20 + numberOfLineBreaks * 20 + 12 + 2;
        return newHeight;
    }

    handleChange = (event) => {
        this.setState({ user: event.target.value.replace(" ", "") });
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.firstSubmission = true;
        this.retrievePhotos();
        this.changeURLPerUser()
    }

    buildMediaGrid(field, index) {

        let video = /.mp4/.test(field.imageURL);

        const centerImage = {
            margin: '0 auto'
        };
        if (video & this.state.displayGifs) {
            return this.renderGifv(centerImage, field.link, field.imageURL, index)
        } else if (this.state.displayGifs && spreadURL("end", field.imageURL) === "gifv") {
            let newLink = spreadURL("start", field.imageURL) + "mp4";
            return this.renderGifv(centerImage, field.link, newLink, index)
        } else if (this.state.displayGifs && spreadURL("end", field.imageURL) === "gif") {
            // let newLink = spreadURL("start", field.imageURL) + "mp4";
            // return this.renderGifv(centerImage, field.link, field.imageURL, index)
            return (
                <Col xs={this.state.num} md={this.state.num} key={index}>
                    <br />
                    <a href={field.link}><Image style={centerImage} src={field.imageURL} responsive /></a>
                </Col>
            )
        } else if (this.state.displayPics && spreadURL("end", field.imageURL) === "jpg" |
            spreadURL("end", field.imageURL) === "png") {
            return (
                <Col xs={this.state.num} md={this.state.num} key={index}>
                    <br />
                    <a href={field.link}><Image style={centerImage} src={field.imageURL} responsive /></a>
                </Col>
            )
        }
    }

    handleBaconChange = (event) => {
        localStorage.setItem("NSFW", event.target.checked);
        localStorage.setItem("onlynsfw", event.target.checked);
        this.switchNsfw = event.target.checked;
        this.setState({ nsfw: event.target.checked, onlyNsfw: false })
    }

    chooseGrid(title, num, renderCarousel) {
        localStorage.setItem("gridStateTitle", title);
        localStorage.setItem("gridState", num);

        this.setState({
            dropDownTitle: title,
            num: num,
            renderCarousel: renderCarousel
        })
    }

    displayOnlyNSFW = () => {
        this.setState({
            onlyNsfw: !this.state.onlyNsfw
        })
    }

    choosePreviousUserName(userName) {
        this.setState({ user: userName, apiLimit: 50 });
    }

    clearLocalStorage = () => {
        localStorage.clear();
        this.setState({
            userList: []
        })
    }

    renderSumbitBox = (inputBoxWidth) => {


        let fullScreenCssWidth = this.state.photos.length === 0 ? "initial-screen-input-box" : "secondary-screen-input-box"
        return (
            <Form onSubmit={this.handleSubmit} inline>
                <FormGroup controlId="formInlineName">
                    <FormControl
                        contentEditable
                        // style={{ minWidth: inputBoxWidth }}
                        className={fullScreenCssWidth}
                        type="text"
                        value={this.state.user}
                        placeholder="Username"
                        onChange={this.handleChange}
                        maxLength="20" />
                    <input type="submit" value="Search"></input>
                    {/* <button type="submit" value="Submit" className="submit-button">
                        <img src="../src/assets/images/arrow_right.png" alt="Submit" style={{ width: '28%' }}>
                        </img>
                    </button> */}
                </FormGroup>
            </Form>
        )
    }

    renderPhotos() {
        let nsfwSet = new Set();
        let { error, photos, renderCarousel, onlyNsfw, nsfw } = this.state;
        let { submittedElements } = this.props;

        if (submittedElements.length === 0 && error === null && photos.length === 0) {
            if (this.firstSubmission === true) {
                return (
                    <div className="text-center">
                        {/* This person has no submissons. */}
                        <Dimmer active>
                            <Loader content='Loading' />
                        </Dimmer>

                    </div>
                )
            }
            return (
                <div className="text-center">
                    Reddit Pic Seeker
                </div>
            )
        } else if (submittedElements.length > 0 && error === null && photos.length === 0) {
            return (
                <div className="text-center">
                    This user doesn't have any photos.
                    <Segment>
                        <Dimmer active>
                            <Loader content='Loading' />
                        </Dimmer>

                    </Segment>
                </div>
            )
        } else if (error !== null) {
            return (
                <div className="text-center">
                    {error}
                </div>
            )
        } else {
            if (renderCarousel === true) {
                return null;
            } else {
                return photos.map((field, index) => {
                    nsfwSet.add(field.nsfw);
                    if (nsfw === true && onlyNsfw) {
                        if (field.nsfw === true) {
                            return this.buildMediaGrid(field, index)
                        }
                    } else if (nsfw === true) {
                        return this.buildMediaGrid(field, index)
                    } else if (nsfw === false) {
                        // if (!nsfwSet.has(false)) {
                        //     return (
                        //         <span>
                        //             No PG Photos available
                        //     </span>
                        //     )
                        // } else {
                        if (field.nsfw === false) {
                            return this.buildMediaGrid(field, index)
                        }
                        // }
                    }
                })
            }
        }
    }

    noPGPhotos() {
        return (
            <span>
                No PG Photos available
            </span>
        )
    }


    renderCheckbox() {
        return (
            <span>
                <label className="form-check-label" >only nsfw:</label>
                <div>
                    <input
                        type="checkbox"
                        className="form-check-input"
                        onChange={this.displayOnlyNSFW}
                        checked={this.state.onlyNsfw} />
                </div>
            </span>
        )
    }

    renderGridDropdownButton() {
        return (
            <DropdownButton
                bsSize="small"
                title={this.state.dropDownTitle}
                id="dropdown-size-small">
                <MenuItem eventKey="1" onSelect={() => this.chooseGrid("Large", 12)}>Large</MenuItem>
                <MenuItem eventKey="2" onSelect={() => this.chooseGrid("Medium", 6)}>Medium</MenuItem>
                <MenuItem eventKey="3" onSelect={() => this.chooseGrid("Small", 3)}>Small</MenuItem>
                <MenuItem eventKey="4" onSelect={() => this.chooseGrid("Tiny", 1)}>Tiny</MenuItem>
            </DropdownButton>
        )
    }

    renderNSFWToggle() {
        let Checkbox = this.state.nsfw ? this.renderCheckbox() : null;

        return (
            <span className="nsfw_center nsfw_group">
                <span>nsfw: </span>
                <Toggle
                    defaultChecked={this.state.nsfw}
                    onChange={this.handleBaconChange}
                    ref={this.switchNsfw} />
                <div> {Checkbox}</div>
            </span>
        )
    }

    renderSubmittedDropdown() {
        return (
            <div className="submitted-dropdown">
                <DropdownButton
                    bsSize="xsmall"
                    title="Submitted Usernames"
                    id="dropdown-size-extra-small">
                    {this.renderSubmittedItems()}
                    {this.renderClearSubmittedButton()}
                </DropdownButton>
            </div >
        )
    }



    renderClearSubmittedButton() {
        return (
            <a onClick={() => this.clearLocalStorage()}>
                <li style={{ padding: '3px 20px', cursor: "pointer" }}> Clear List</li>
            </a>

        )
    }

    renderSubmittedItems() {
        return this.state.userList.map((field, index) => {
            return (
                <MenuItem
                    key={index}
                    eventKey="index"
                    onSelect={() => this.choosePreviousUserName(field)}>{field}</MenuItem>
            )
        });
    }

    renderLoadMoreButton() {
        return (
            <Button bsStyle="primary" onClick={() => this.loadMoreMedia()}>Load More</Button>
        )
    }

    loadMoreMedia = () => {

        this.retrieveMoreMedia()
    }

    toggleVisibility = () => {
        this.setState({ visible: !this.state.visible })
    }

    displayInitialView() {
        return (
            <div className="first-view centered">
                <div className="input-style center padding-to-center">
                    {this.renderSumbitBox("85%")}
                    <div className="dropdown-submitted">
                        {this.renderSubmittedDropdown()}
                        {this.renderMediaCheckbox()}
                    </div>
                </div>
            </div>
        )
    }

    displaySecondView() {
        return (
            <div className="second-view">
                {!this.state.isScrolled && <div className="fixed-header">
                    <div className="fixed-centered-section input-style center">
                        {this.renderSumbitBox("45em")}
                        <div className="dropdown-grid">
                            {this.renderSubmittedDropdown()}
                            {this.renderMediaCheckbox()}
                        </div>
                    </div>
                </div>}
                {/* {Carousel} */}
                <Grid
                    fluid={true}>
                    <Row className="show-grid">
                        {this.renderPhotos()}
                    </Row>
                </Grid>
                <footer>
                    {this.renderLoadMoreButton()}
                </footer>
            </div>
        )
    }

    renderMenu() {

        let topMenu = this.state.isScrolled ? <Menu.Item
            className="submission-item-menu-layer"
            onClick={this.handleItemClick}>
            <div className="first-view centered">
                <div className="input-style center padding-to-center username-menu-layer">
                    {this.renderSumbitBox("15%")}
                    {this.renderSubmittedDropdown()}
                    {this.renderMediaCheckbox()}
                </div>
            </div>
        </Menu.Item> : <Menu.Item onClick={()=>{
       this.setState({ user: "" });
    //    this.firstSubmission = true;
    //    this.retrievePhotos();
       this.changeURLPerUser()
        }}
            className="submission-item-menu-layer"
          ><span>Reddit Pic Seeker</span></Menu.Item>
        return (
            <Menu className="fixed " secondary>
                <Header>
                    <Menu.Item onClick={this.toggleVisibility}><Icon name="sidebar" /></Menu.Item>
                </Header>
                {topMenu}
            </Menu>
        )
    }

    // data.children[1].data.preview.reddit_video_preview.fallback_url



    renderSidebar() {
        let displayView = this.firstSubmission ? this.displaySecondView() : this.displayInitialView();

        return (
            <Sidebar.Pushable as={Segment}
                className={"unset-sidebar-height"}>
                <Sidebar
                    className="fixed top-padding top-position-padding dimmed"
                    as={Menu}

                    width='thin'
                    visible={this.state.visible}
                    icon='labeled'
                    vertical inverted>
                    <div>
                        <Menu.Item name='grid'>
                            {this.renderGridDropdownButton()}
                        </Menu.Item>

                        <Menu.Item name='nsfw'>
                            <span>{this.renderNSFWToggle()}</span>
                        </Menu.Item>
                    </div>
                </Sidebar>
                <Sidebar.Pusher>
                    <SemanticGrid centered>
                        <SemanticGrid.Row stretched>
                            <SemanticGrid.Column>
                                <Segment basic
                                    className="background bottom top-padding">
                                    {displayView}
                                </Segment>
                            </SemanticGrid.Column>
                        </SemanticGrid.Row>
                    </SemanticGrid>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        )
    }

    render() {

        let Carousel = this.state.renderCarousel ? <PhotoCarousel photos={this.state.photos} /> : null;
        return (

            <Router>
                <Switch>
                    <Route path="/">
                        <div style={{ "height": "100%" }}>
                            {this.renderMenu()}
                            {this.renderSidebar()}

                        </div>
                    </Route>
                </Switch>
            </Router>


        )
    }

    captureURL() {
        let { slug } = useParams();
        return ""
    }

}



const mapStateToProps = state => {
    return {
        redditTitles: state.Reddit.redditTitles,
        submittedElements: state.Reddit.submittedElements,
        albumPhotos: state.Reddit.albumPhotos,
        userError: state.Reddit.userError
    }
};

export default connect(mapStateToProps)(withRouter(RedditTitles));
