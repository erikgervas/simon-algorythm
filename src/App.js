import React, { Component } from 'react';
import Utils from './Utils';
import './App.css';
import { Header } from "./Header";
import { FileInput } from "./FileInput";
import { ActionButton } from "./ActionButton";

export class App extends Component {

  constructor(props) {
    super(props);
  }

  onFileChange = (files) => {
    let image = new Image();
    let canvas = this.refs.originalCanvas;
    if (files[ 0 ]) {
      image.src = URL.createObjectURL(files[ 0 ]);
    }

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
    }
  };

  handleClick = () => {
    console.log("Encrypting..");
    let originalCanvas = this.refs.originalCanvas;
    let encryptedCanvas = this.refs.encryptedCanvas;
    Utils.encrypt(originalCanvas, encryptedCanvas);
  };

  render() {
    return (
      <div className="app">
        <Header/>
        <div className="main">
          <div className="container">
            <div className="box">
              <FileInput onChange={ this.onFileChange } message="Ingresar archivo a cifrar..."/>
              <div className="canvas">
                <canvas ref="originalCanvas"/>
              </div>
              <ActionButton onClick={ this.handleClick } message="Cifrar"/>
            </div>
          </div>
          <div className="container">
            <div className="box">
              <FileInput onChange={ this.onFileChange } message="Ingresar archivo a descifrar..."/>
              <div className="canvas">
                <canvas ref="encryptedCanvas"/>
              </div>
              <ActionButton onClick={ this.handleClick } message="Descifrar"/>
            </div>
          </div>
        </div>
      </div>
    )
  }
}