import React from 'react';
import { Carousel } from 'react-bootstrap';

class PhotoCarousel extends React.Component {

    constructor(props) {
        super(props)
        this.carousel = this.carousel.bind(this);
    }

    carousel() {
        console.log(this)
        return this.props.photos.map((field, index) => {
            return (
                <Carousel.Item key={index}>
                    <img width={900} height={500} src={field.imageURL} />
                </Carousel.Item>
            )
        });
    }

    render() {
        return (
            <Carousel indicators={false} className="center">
                {this.carousel()}
            </Carousel >
        )
    }
}
export default PhotoCarousel;
