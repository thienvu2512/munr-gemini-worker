export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    // MỚI — ghé thăm KHÔNG kèm ?url= (vd bấm nút "Thẩm nom") sẽ thấy dòng chữ
    // này thay vì lỗi khó hiểu — để biết CHẮC CHẮN đây là Worker Gemini của
    // MUNR đang chạy đúng code, không phải mẫu mặc định "Hello World!".
    if (!target) {
      return new Response("MUNR Gemini proxy dang chay OK. Can them ?url=... de goi that.", { status: 200 });
    }

    let targetHost;
    try {
      targetHost = new URL(target).hostname;
    } catch (e) {
      return new Response("Bad target url", { status: 400 });
    }
    if (targetHost !== "generativelanguage.googleapis.com") {
      return new Response("Forbidden target host", { status: 403 });
    }

    try {
      const res = await fetch(target, {
        method: request.method,
        headers: { "Content-Type": request.headers.get("Content-Type") || "application/json" },
        body: (request.method === "GET" || request.method === "HEAD") ? undefined : await request.text(),
      });
      const body = await res.arrayBuffer();
      return new Response(body, {
        status: res.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": res.headers.get("Content-Type") || "application/json",
        },
      });
    } catch (err) {
      return new Response("Proxy fetch failed (gemini)", { status: 500 });
    }
  },
};
