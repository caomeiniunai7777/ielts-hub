

## Codely Structured Memories

### User
- [2026-08-19 15:38:54] User is an in-job IELTS test taker (CET-4 445 score, targeting IELTS 6.5 overall). Prep period Aug-Dec 2026 (~110 days). Currently building a personal IELTS prep web app as a side project.

### Feedback

### Project
- [2026-08-19 16:58:25] IELTS Hub project: Pure HTML/CSS/JS web app at /Users/IELTS/. No frameworks, no build tools, no backend. All data in localStorage with JSON export/import for cross-device migration. User explicitly chose pure web over Electron/exe. Design: "Cat Bag" 日系治愈便签風, Warm Cream & Bento Brown color scheme. 6 modules: Dashboard(打卡/计划), Vocabulary(22章词汇真经+3遍过关+艾宾浩斯), Reading(剑4-21+538同义替换), Speaking(TTS多国口音+语音转写), Writing(TR/CC/LR/GRA精批), Resources(导航+数据管理). PRD source: /Users/IELTS/word/IELTS提示词.docx. Added: global TTS pronunciation (UK/US toggle), 538 study/mastery system with data-linked metrics. - [2026-08-19 16:30:00] IELTS Hub data extraction: 538考点词 PDF is text-based, extracted 376 groups (20超高频+100高频+256考点) via PyMuPDF, 100% accurate, stored in src/js/data/synonyms538.js. 词汇真经 PDF is scanned image (336 pages), requires OCR. Using EasyOCR (en+ch_sim, CPU ~15s/page) with two-column layout detection. OCR script: /tmp/vocab_ocr_batch.py, parser: /tmp/parse_vocab_ocr.py. Chapter TOC extracted: 22 chapters from 自然地理(p10) to 时间日期(p316). Parser uses state machine to handle [例]/[搭]/[记] context sections and review word lists.

### Reference

