import React from "react";
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';

export const SaveButton = ({ onClick }) => {
  return (
    <Button variant="contained" size="small" onClick={ onClick }>
      <SaveIcon/>
      Guardar
    </Button>
  )
};
