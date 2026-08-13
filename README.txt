v16 PDF 게시 방식

ebook/
├─ index.html       E북 편집기
├─ images/          고정 이미지
└─ view/
   ├─ index.html    PDF 페이지 넘김 학부모 뷰어
   └─ book.pdf      편집기에서 완성 후 생성하여 여기에 업로드

사용 순서
1. 편집기에서 E북 완성
2. '📄 완성 E북 PDF 만들기' 클릭 → book.pdf 다운로드
3. GitHub ebook/view/book.pdf에 업로드/교체
4. 학부모는 .../magicpencel/ebook/view/ 접속
5. PC는 이전/다음 버튼, 모바일은 좌우 스와이프로 페이지 이동

주의: PDF 생성과 PDF.js 뷰어는 CDN 라이브러리를 사용하므로 인터넷 연결이 필요합니다.
