import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Container from './Container';

function start (window): void {
  ReactDOM.render(
    <Container />,
    document.getElementById('app'),
  );
}

start(window);
