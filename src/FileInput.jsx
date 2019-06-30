import React from "react";
import Files from "react-files";

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
    { message }
  </Files>
);