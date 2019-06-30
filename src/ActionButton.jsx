import React from "react";
import { Button } from 'reactstrap';

const buttonStyle = {
  border: "none",
  height: 40,
  fontSize: 16,
  borderRadius: 3,
  backgroundColor: "#0053ff",
  color: "white",
  width: "50%",
  cursor: "pointer"
};

export const ActionButton = ({ onClick, message }) => (
  <Button style={buttonStyle} onClick={ onClick }>{ message }</Button>
);