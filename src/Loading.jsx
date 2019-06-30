import React from 'react';
import Spinner from "react-spinkit";

export const Loading = () => (
  <div style={{display: 'flex', justifyContent: 'center', marginTop: '10vh'}}>
    <Spinner name="pacman" color="red"/>
  </div>
);