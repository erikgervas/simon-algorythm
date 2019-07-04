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

  onFileChange = (files, canvas) => {
    let image = new Image();
    if (files[ files.length - 1 ]) {
      image.src = URL.createObjectURL(files[ files.length - 1 ]);
    }

    Utils.cleanCanvas(this.refs.originalCanvas);
    Utils.cleanCanvas(this.refs.encryptedCanvas);

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
    }
  };

  finishedLoading = () => {
    debugger;
    this.setState({ loading: false })
  };

  handleEncryptClick = () => {
    let originalCanvas = this.refs.originalCanvas;
    let encryptedCanvas = this.refs.encryptedCanvas;
    this.setState({ loading: true }, () => {
      window.setTimeout(() => {
        Utils.scanCanvasAndDo(originalCanvas, encryptedCanvas, "encrypt", this.state.key, this.state.blockMode, this.finishedLoading);
      }, 500);
    });
  };

  handleDecryptClick = () => {
    let originalCanvas = this.refs.originalCanvas;
    let encryptedCanvas = this.refs.encryptedCanvas;
    this.setState({ loading: true }, () => {
      window.setTimeout(() => {
        Utils.scanCanvasAndDo(encryptedCanvas, originalCanvas, "decrypt", this.state.key, this.state.blockMode, this.finishedLoading);
      }, 500);
    });
  };

  saveImage = async (canvas, name) => {
	let link = document.createElement('a');
	link.innerHTML = 'Download image';
	link.addEventListener('click', function (ev) {
	link.href = canvas.toDataURL();
	link.download = name+".png";
	}, false);
	document.body.appendChild(link);
	link.click();
	link.parentNode.removeChild(link);
  }
  
  saveOriginalImage = () => {
	  this.saveImage(this.refs.originalCanvas, "original");
  }
  
  saveEncryptedImage = () => {
	  this.saveImage(this.refs.encryptedCanvas, "encrypted");
  }
  
  render() {
    return (
      <div className="app">
        <Header/>
        <div className="container mt5">
          <div className="key-mode-input">
			<b>Simon72/48 con IV nulo</b>
            <h4>Ingresar clave y modo de encriptación de bloque:</h4>
            <div>
              <span>Clave en hexa:&ensp;</span>
              <input value={ this.state.key }
                     onChange={ (e) => this.setState({ key: e.target.value }) }
                     className="key-input box__dragndrop"/>
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
                <FormControlLabel value="PCBC" control={ <Radio/> } label="PCBC"/>
              </RadioGroup>
            </FormControl>
          </div>
        </div>
        <div className="main mt5">
          <div className="box">
            <FileInput onChange={ (files) => this.onFileChange(files, this.refs.originalCanvas) }
                       message="Ingresar archivo a cifrar..."/>
            <div className="canvas">
              <canvas ref="originalCanvas"/>
            </div>
            <SaveButton onClick={ this.saveOriginalImage }/>
            <br/>
            <ActionButton onClick={ this.handleEncryptClick } message="Cifrar"/>
          </div>
          <Ocultable visible={ this.state.loading }>
            <Loading/>
          </Ocultable>
          <div className="box">
            <FileInput onChange={ (files) => this.onFileChange(files, this.refs.encryptedCanvas) }
                       message="Ingresar archivo a descifrar..."/>
            <div className="canvas">
              <canvas ref="encryptedCanvas"/>
            </div>
            <SaveButton onClick={ this.saveEncryptedImage }/>
            <br/>
            <ActionButton onClick={ this.handleDecryptClick } message="Descifrar"/>
          </div>
        </div>
      </div>
    )
  }
}