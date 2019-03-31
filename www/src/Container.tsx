import { default as React, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import classNames from 'classnames';
import { fileToText } from './libs/readFile';
import * as wasm from '../../pkg/wasm_lifegame';
import { s3911 } from './libs/sample';

export default function Container (props) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [data, setData] = useState('');
  const [margin, setMargin] = useState(200);
  const [delay, setDelay] = useState(10);
  const [playId, setPlayId] = useState<any>(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notf, setNotf] = useState(false);

  useEffect(() => {
    canvas && setContext(canvas.getContext('2d'));
  }, [canvas]);

  useEffect(() => {
    setData(s3911);
  }, [context]);

  useEffect(() => {
    if (!context || !data) {
      return;
    }

    const [ok, message] = wasm.load(data);

    if (!ok) {
      Swal.fire({
        title: 'Something wrong',
        text: message,
        type: 'error',
      });
      setLoading(false);
      return;
    }

    setLoaded(true);

    wasm.expand(canvas, margin);
    wasm.draw(context);

    clearInterval(playId);
    setLoading(false);
  }, [context, data, margin]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    setTimeout(() => {
      setNotf(true);
      setTimeout(() => {
        setNotf(false);
      }, 5000);
    }, 1000);
  }, [loaded]);

  async function onAttach (e: any) {
    e.preventDefault();

    const file = e.target.files[0];
    if (!file) {
      return;
    }
    e.target.files = new DataTransfer().files;

    setLoaded(false);
    setNotf(false);
    setLoading(true);
    setData('');
    setData(await fileToText(file));
  }

  function submit (e) {
    e.preventDefault();

    const [ok, message] = wasm.load(data);

    if (!ok) {
      Swal.fire({
        title: 'Something wrong',
        text: message,
        type: 'error',
      });
      setLoading(false);
      return;
    }

    wasm.expand(canvas, margin);
    wasm.draw(context);
    setTimeout(() => setLoaded(false));

    clearInterval(playId);
    setPlayId(
      setInterval(
        () => {
          wasm.step();
          wasm.draw(context);
        },
        delay,
      ),
    );
  }

  const notification = notf
    ? <div className='notification_tip'>New data loaded. Click to start.</div>
    : null;

  const labelClassNames = classNames('load_button', { disabled: loading });

  return (
    <div className='global_container'>
      <div className='header'>
        <h1 className='header__title'>Lifegame player</h1>
        <form className='header__form' onSubmit={e => submit(e)}>
          <ul className='header__input'>
            <li className='header__input__item'>
              <label htmlFor='attachments' className={labelClassNames}>
                <i className='fas fa-upload mr-1' />
                Load RLE
              </label>
            </li>
            <li className='header__input__item'>
              <button type='submit' className='btn start_button' disabled={loading}>
                <i className='fas fa-play-circle mr-1' />
                Start
              </button>
              {notification}
            </li>
            <li className='header__input__item'>
              <label>margin:</label>
              <input className='header__input__num' type='text' value={margin} onChange={e => setMargin(+e.target.value)} />
            </li>
            <li className='header__input__item'>
              <label>delay:</label>
              <input className='header__input__num' type='text' value={delay} onChange={e => setDelay(+e.target.value)} />
              <span>ms</span>
            </li>
          </ul>
          <div className='header__hidden'>
            <input type='file' id='attachments' onChange={onAttach} />
          </div>
        </form>
      </div>
      <div className='canvas_container'>
        <canvas className='canvas' id='Canvas' ref={setCanvas} style={{}} />
      </div>
    </div>
  );
}
