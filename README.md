# FlashPractice – free, local-AI translation grader

A static Vietnamese–English translation practice site with 5 topics and 150 A2–B1 prompts. The AI grader runs in the learner's browser using Transformers.js and the open-weight Qwen2.5-1.5B-Instruct model in ONNX format.

## How grading works

- The browser loads `onnx-community/Qwen2.5-1.5B-Instruct` in 4-bit quantized form on first use.
- When available, inference runs on WebGPU; the app falls back to WASM/CPU when WebGPU initialization fails.
- The app sends the Vietnamese prompt and the learner's English translation to the local model in the same browser tab. It does not call a paid AI API or send answers to a grading server.
- The model returns scores for meaning (4), grammar (2), vocabulary (2), and naturalness (2), plus Vietnamese feedback, corrections, and a sample answer.
- Answers and results are stored in this browser profile's localStorage. Use **Xuất CSV** as a backup.

## First use

1. Open the published site in a recent version of Chrome or Edge.
2. Select a topic and a question.
3. Type your translation and click **Tải AI & chấm câu**.
4. Wait while the browser downloads the model the first time (roughly 1.6 GB); keep the tab open. Later sessions should reuse the browser cache.
5. Click **Chấm câu này** for each attempt. If you edit an answer after receiving feedback, re-grade it.
6. Clicking **Câu tiếp theo** will grade a non-empty ungraded or edited answer first; after the feedback appears, click again to advance.

## Run locally on Windows

Extract the ZIP, then double-click `run-local.bat`. It starts a small local web server and opens `http://localhost:8000` in your browser. Python must be installed. Browsers restrict ES modules on `file://`, so do not open `index.html` by double-clicking it.

You can also start any static web server in this folder and visit its local address.

## Publish free using GitHub Pages

This repository is public and can be hosted on GitHub Pages. In the repository, choose **Settings → Pages → Deploy from a branch → main / root**.

## Notes and limitations

- The model is smaller than paid cloud models. Review its score as learning feedback, not an official IELTS score.
- Performance depends on the computer's GPU, available memory, browser support, and network speed for the initial model download. CPU fallback may be slow.
- If WebGPU is unavailable and CPU mode is too slow, AI grading may be impractical on that device.
- Model files and Transformers.js are downloaded from public Hugging Face / jsDelivr endpoints. No API key is required.
