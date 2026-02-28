use warp::Filter;
use futures_util::{StreamExt, SinkExt};

#[tokio::main]
async fn main() {
    let addr = ([127, 0, 0, 1], 8080);
    let jam_route = warp::path("jam")
        .and(warp::ws())
        .map(|ws: warp::ws::Ws| {
            ws.on_upgrade(|mut websocket| async move {
                while let Some(result) = websocket.next().await {
                    if let Ok(msg) = result {
                        let _ = websocket.send(msg).await;
                    }
                }
            })
        });

    warp::serve(jam_route).run(addr).await;
}
