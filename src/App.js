import React, { Component } from 'react';
import Utils from './Utils';
import './App.css';
import { Header } from "./Header";
import { FileInput } from "./FileInput";
import { ActionButton } from "./ActionButton";
import Ocultable from "./Ocultable";
import { Loading } from "./Loading";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import { SaveButton } from "./SaveButton";

export class App extends Component {

  constructor(props) {
    super(props);
    this.state = { key: '0x1211100a0908020100', blockMode: 'ECB', loading: false };
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

  finishedLoading = () => {
    this.setState({ loading: false })
  };

  handleEncryptClick = () => {
    let originalCanvas = this.refs.originalCanvas;
    let encryptedCanvas = this.refs.encryptedCanvas;
    this.setState({ loading: true }, () => {
      Utils.scanCanvasAndDo(originalCanvas, encryptedCanvas, "encrypt", this.state.key, this.state.blockMode, this.finishedLoading);
    });
  };

  handleDecryptClick = () => {
    let originalCanvas = this.refs.originalCanvas;
    let encryptedCanvas = this.refs.encryptedCanvas;
    this.setState({ loading: true }, () => {
      Utils.scanCanvasAndDo(encryptedCanvas, originalCanvas, "decrypt", this.state.key, this.state.blockMode, this.finishedLoading);
    });
  };

  saveEncryptedImage = async () => {
    let encryptedCanvas = this.refs.encryptedCanvas;
    let blob = await new Promise(resolve=>encryptedCanvas.toBlob(resolve));
    let url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  render() {
    return (
      <div className="app">
        <Header/>
        <div className="container mt5">
          <div className="key-mode-input">
            <h4>Ingresar clave y modo de encriptación de bloque:</h4>
            <div>
              <span>Clave en hexa:&ensp;</span>
              <input value={ this.state.key }
                     onChange={ (e) => this.setState({ key: e.target.value }) }
                     className="key-input"/>
            </div>
            <br/>
            <FormControl component="fieldset">
              <FormLabel component="legend">Elegir modo:</FormLabel>
              <RadioGroup
                aria-label="Block mode"
                value={ this.state.blockMode }
                onChange={ (event) => this.setState({ blockMode: event.target.value }) }
              >
                <FormControlLabel value="ECB" control={ <Radio/> } label="ECB"/>
                <FormControlLabel value="CBC" control={ <Radio/> } label="CBC"/>
              </RadioGroup>
            </FormControl>
          </div>
        </div>
        <div className="main mt10">
          <div className="box">
            <FileInput onChange={ this.onFileChange } message="Ingresar archivo a cifrar..."/>
            <div className="canvas">
              <canvas ref="originalCanvas"/>
            </div>
            <ActionButton onClick={ this.handleEncryptClick } message="Cifrar"/>
          </div>
          <div className="box">
            <FileInput onChange={ this.onFileChange } message="Ingresar archivo a descifrar..."/>
            <div className="canvas">
              <canvas ref="encryptedCanvas"/>
            </div>
            <SaveButton onClick={ this.saveEncryptedImage }/>
            <br/>
            <ActionButton onClick={ this.handleDecryptClick } message="Descifrar"/>
          </div>
        </div>
        <Ocultable visible={ this.state.loading }>
          <Loading/>
        </Ocultable>
      </div>
    )
  }
}