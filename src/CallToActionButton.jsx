import React from "react";

export const CallToActionButton = ({ onClick, message }) => (
  <button onClick={ onClick }>
    { message }
  </button>
);