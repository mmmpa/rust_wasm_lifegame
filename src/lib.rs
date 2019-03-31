#[macro_use]
extern crate lazy_static;
extern crate lifegame;
extern crate web_sys;

mod utils;

use wasm_bindgen::Clamped;
use wasm_bindgen::prelude::*;
use std::sync::{Arc, RwLock};
use lifegame::rle::Rle;
use lifegame::game::Game;
use std::string::ToString;
use wasm_bindgen::prelude::*;

cfg_if::cfg_if! {
    if #[cfg(feature = "wee_alloc")] {
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}


#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

struct Container {
    margin: usize,
    src: String,
    game: Option<Game>,
    bitmap: Vec<u8>,
}

lazy_static! {
    static ref LOCKER: Arc<RwLock<Container>> = {
        let container = Container {
            margin: 100,
            src: "".to_string(),
            game: None,
            bitmap: vec![],
        };
        Arc::new(RwLock::new(container))
    };
}

type ReturningResult = js_sys::Array;

fn result_to_js(result: Result<(), String>) -> (bool, ReturningResult) {
    match result {
        Ok(()) => (true, js_success_result()),
        Err(e) => (false, js_failure_result(&e)),
    }
}

fn js_success_result() -> ReturningResult {
    let array = js_sys::Array::new();
    array.push(&wasm_bindgen::JsValue::TRUE);
    array.push(&wasm_bindgen::JsValue::from_str("ok"));
    array
}

fn js_failure_result(str: &str) -> ReturningResult {
    let array = js_sys::Array::new();
    array.push(&wasm_bindgen::JsValue::FALSE);
    array.push(&wasm_bindgen::JsValue::from_str(str));
    array
}

#[wasm_bindgen]
pub fn load(rle: &str) -> ReturningResult {
    {
        let mut container = LOCKER.write().unwrap();
        container.src = rle.to_string();
    }
    let (_, result) = result_to_js(reload());
    result
}

#[wasm_bindgen]
pub fn expand(canvas: web_sys::Element, margin: usize) -> ReturningResult {
    {
        let mut container = LOCKER.write().unwrap();
        container.margin = margin;
    }

    let (ok, result) = result_to_js(reload());

    if !ok {
        return result;
    }

    let container = LOCKER.read().unwrap();
    let game = &container.game.as_ref().unwrap();

    let w = game.width.to_string();
    let h = game.height.to_string();
    let ww = (game.width * 2).to_string();
    let hh = (game.height * 2).to_string();

    canvas.set_attribute("width", &w).unwrap();
    canvas.set_attribute("height", &h).unwrap();
    canvas.set_attribute("style", &format!("width: {}px; height: {}px", &ww, &hh)).unwrap();

    result
}

pub fn reload() -> Result<(), String> {
    let mut container = LOCKER.write().unwrap();
    let (w, h, map) = match Rle::from_string(&container.src, container.margin) {
        Ok(r) => r,
        Err(e) => return Err(format!("{:?}", e))
    };
    let game = Game::new(w, h, &map);

    container.bitmap = vec![0; &game.lives().len() * 4];
    container.game = Some(game);

    Ok(())
}

#[wasm_bindgen]
pub fn draw(context: web_sys::CanvasRenderingContext2d) -> ReturningResult {
    let (width, height, lives) = {
        let container = LOCKER.read().unwrap();
        let game = &container.game.as_ref().unwrap();
        (game.width, game.height, game.lives())
    };

    let mut container = LOCKER.write().unwrap();
    let bitmap = &mut container.bitmap;

    for (i, b) in lives.iter().enumerate() {
        if *b {
            bitmap[i * 4 + 3] = 255;
        } else {
            bitmap[i * 4 + 3] = 0;
        }
    }

    match web_sys::ImageData::new_with_u8_clamped_array_and_sh(Clamped(&mut container.bitmap[..]), width as u32, height as u32) {
        Ok(img) => { context.put_image_data(&img, 0.0, 0.0).unwrap(); },
        Err(_) => {}
    };

    js_success_result()
}

#[wasm_bindgen]
pub fn step() {
    let mut container = LOCKER.write().unwrap();
    let game = &mut container.game.as_mut().unwrap();
    game.step();
}
