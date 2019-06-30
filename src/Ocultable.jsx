import React from "react";

const TRUE = "true";
const Ocultable = ( ({ visible, children }) => (
  visible === TRUE || visible === true ?
    <div>{ children }</div> :
    <div/>
) );

export default Ocultable;