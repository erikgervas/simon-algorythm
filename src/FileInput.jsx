import React from "react";
import Files from "react-files";
import 'font-awesome/css/font-awesome.css';

export const FileInput = ({ onChange, message }) => (
  <Files
    className='files-dropzone'
    onChange={ onChange }
    accepts={ [ '.bmp' ] }
    maxFiles={ 1 }
    maxFileSize={ 10000000 }
    minFileSize={ 0 }
    clickable
  >
    <p><i className="fa fa-angle-down"/>&ensp;{ message }</p>
  </Files>
);