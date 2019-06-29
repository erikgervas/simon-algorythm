import React, { Component } from 'react';
import './App.css';

export class App extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  onChange = (event) => {
    let image = new Image();
    let canvas = this.refs.originalImage;
    if (event.target.files && event.target.files[ 0 ]) {
      image.src = URL.createObjectURL(event.target.files[ 0 ]);
    }

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
    }
  };

  render() {
    return (
      <div>
        <input type="file"
               onChange={ this.onChange }
               alt="Upload image"/>
        <br/>
        <canvas ref="originalImage"/>
      </div>
    )
  }
}