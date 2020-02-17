import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { render } from 'react-dom';
import axios from 'axios';
import { connect } from 'react-redux';
import toggleStyles from '../assets/Toggle.css';
import { Button, FormControl, Grid, Row, Col, Image, DropdownButton, MenuItem, Carousel, Modal, Checkbox } from 'react-bootstrap';
import Toggle from 'react-toggle';
import PhotoCarousel from './PhotoCarousel';
import clientId from './clientId.json';
import PropTypes from 'prop-types';
import { Menu, Item, Sidebar, Segment, Icon, Header, Sticky, Rail, Grid as SemanticGrid } from 'semantic-ui-react';
import { FETCH_USER_SUBMITTED_POSTS, FETCH_ADDITIONAL_USER_SUBMITTED_POSTS } from '../actions/Reddit'
// import BurgerMenu from 'react-burger-menu';//code clean up
//categories
//git uploading
//similar picture removal
//adding cookies
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
            sidebarOpen: true,
            lastPageId: "",
            visible: false
        }
    }

    componentWillMount() {

        if (localStorage.getItem("userList") !== null && localStorage.getItem("gridStateTitle") !== null) {
            var newList = [...new Set(localStorage.getItem("userList").split(","))]
            this.setState({
                userList: newList,
                num: Number(localStorage.getItem("gridState")),
                dropDownTitle: localStorage.getItem("gridStateTitle"),
                nsfw: JSON.parse(localStorage.getItem("NSFW"))
            })

        }

    }

    retrievePhotos = async () => {

        let response = await this.props.dispatch(FETCH_USER_SUBMITTED_POSTS(this.state.user))
        this.retrievePage(response.data.children.pop())
        this.resetLocalState();
        this.createPhotoArray();
        this.setLocalStorage();

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

        this.retrievePage(response.data.children.pop())

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

    spreadURL = (option, link) => {

        var urlStart = /.+?:\/\/[^\s]+\/\S+\./;
        var urlEnd = /\w+$/
        var gfycat2 = /gfycat/
        var albumRegex = /[^ht][^/\/\imgur.co][^a\/]\w+(?!\w)/
        var galleryRegex = /[^ht][^/\/\imgur.co][^gallery\/]\w+(?!\w)/


        let regexEnd = link.match(urlEnd);
        let regexStart = link.match(urlStart);
        let gfycat = link.match(gfycat2);
        let album = /imgur.com\/a\//.test(link);
        let gallery = /imgur.com\/gallery\//.test(link);
        let albumLinkParser = link.match(albumRegex);
        let galleryParser = link.match(galleryRegex);

        if (regexEnd === null) {

        }

        switch (option) {
            case "end":
                return regexEnd[0];
            case "start":
                return regexStart[0];
            case "gallery":
                return gallery;
            case "album":
                return album;
            case "gfycat":
                return gfycat;
            case "albumRegex":
                return albumLinkParser;
            case "galleryRegex":
                return galleryParser;
            default:
                break;
        }
    }


    createPhotoArray = () => {

        // let photoArray = this.state.photos;
        // let set = new Set();


        // set.add(JSON.stringify(field))

        return this.props.submittedElements.map((field, index) => {
            let imageURL = field.data.url;
            let link = "http://www.reddit.com" + field.data.permalink;


            if (field.data.domain === "m.imgur.com" ||
                field.data.domain === "i.imgur.com" ||
                field.data.domain === "imgur.com") {

                if (field.data.domain === "imgur.com" || field.data.domain === "m.imgur.com") {
                    if (this.spreadURL("album", imageURL)) {
                        this.retrieveAlbumPhotos(link, this.spreadURL("albumRegex", imageURL), field.data.over_18);
                    }
                    else if (this.spreadURL("gallery", imageURL)) {
                        this.retrieveAlbumPhotos(link, this.spreadURL("galleryRegex", imageURL), field.data.over_18);
                    }
                    else if (this.spreadURL("end", imageURL) === "gifv") {
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
            // else if (this.spreadURL("gfycat", imageURL) === "gfycat") {
            //     debugger
            //     regexStart = this.spreadURL("start", imageURL) + "mp4"
            //     // photoArray.push({ regexStart, nsfw: field.data.over_18 })
            //     // this.addPhotosToState(photoArray);


            // }

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

    renderMediaCheckbox() {
        return (
            <form>
                <Checkbox
                    name="displayPics"
                    onChange={this.handleCheckboxMediaChange}
                    defaultChecked={this.state.displayPics} >
                    Pics
    </Checkbox>
                <Checkbox
                    name="displayGifs"
                    onChange={this.handleCheckboxMediaChange}
                    checked={this.state.displayGifs}>
                    Gifs
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
                            autoPlay="autoplay"
                            loop="loop"
                            style={{ maxWidth: 100 + '%' }}
                            src={imageURL} />
                    </a>
                </div>
            </Col>
        )
    }

    handleChange = (event) => {
        this.setState({ user: event.target.value.replace(" ", "") });
        // this.setState({ user: "dusenberrypie" });
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.firstSubmission = true;
        this.retrievePhotos();
    }

    buildMediaGrid(field, index) {

        let video = /.mp4/.test(field.imageURL);

        const centerImage = {
            margin: '0 auto'
        };
        if (video & this.state.displayGifs) {
            return this.renderGifv(centerImage, field.link, field.imageURL, index)
        } else if (this.state.displayGifs && this.spreadURL("end", field.imageURL) === "gifv") {
            let newLink = this.spreadURL("start", field.imageURL) + "mp4";
            return this.renderGifv(centerImage, field.link, newLink, index)
        } else if (this.state.displayPics && this.spreadURL("end", field.imageURL) === "jpg" |
            this.spreadURL("end", field.imageURL) === "png") {
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

        return (
            <form onSubmit={this.handleSubmit}>
                <label style={{ position: "relative" }}>
                    <FormControl
                        // style={{ minWidth: inputBoxWidth }}
                        type="text"
                        value={this.state.user}
                        placeholder="Username"
                        onChange={this.handleChange} />
                    <button type="submit" value="Submit" className="submit-button">
                        <img src="../src/assets/images/arrow_right.png" alt="Submit" style={{ width: '28%' }}>
                        </img>
                    </button>
                </label>
            </form>
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
                        This person has no submissons.
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
            <div>
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
                <section>
                    <div className="input-style center padding-to-center">
                        {this.renderSumbitBox("85%")}
                        <div className="dropdown-submitted">
                            {this.renderSubmittedDropdown()}
                            {this.renderMediaCheckbox()}
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    displaySecondView() {
        return (
            <div className="second-view">
                <div className="fixed-header">
                    <div className="fixed-centered-section input-style center">
                        {this.renderSumbitBox("45em")}
                        <div className="dropdown-grid">
                            {this.renderSubmittedDropdown()}
                            {this.renderMediaCheckbox()}
                        </div>
                    </div>
                </div>
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

    render() {
        let { submittedElements } = this.props;
        // console.log(this.state)

        let Carousel = this.state.renderCarousel ? <PhotoCarousel photos={this.state.photos} /> : null;
        let displayView = this.firstSubmission ? this.displaySecondView() : this.displayInitialView();
        return (
            <div style={{ "height": "100%" }}>
                <Menu className="fixed ">

                    <Header>
                        <Menu.Item onClick={this.toggleVisibility}><Icon name="sidebar" /></Menu.Item>
                    </Header>

                </Menu>
                <Sidebar.Pushable as={Segment}>
                    <Sidebar
                        className="fixed top-padding top-position-padding dimmed"
                        as={Menu}

                        width='thin'
                        visible={this.state.visible}
                        icon='labeled'
                        vertical inverted>
                        <Menu.Item name='grid'>
                            {this.renderGridDropdownButton()}
                        </Menu.Item>

                        <Menu.Item name='nsfw'>
                            <span>{this.renderNSFWToggle()}</span>
                        </Menu.Item>

                    </Sidebar>
                    <Sidebar.Pusher>

                        <SemanticGrid>
                            <SemanticGrid.Row>
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



            </div>
        )
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

export default connect(mapStateToProps)(RedditTitles);
