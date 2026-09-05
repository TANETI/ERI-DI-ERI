import Card from '../components/Card'

export default function AlbumPage() {
  return (
    <main className="page">
      <header className="section-header">
        <div>
          <p className="eyebrow">날짜와 연결되는 사진 기록</p>
          <h1>앨범</h1>
        </div>
      </header>

      <Card>
        <div className="coming-soon">
          <div className="coming-icon" aria-hidden="true">📷</div>
          <h2>사진 저장은 Phase 3에서 연결해요</h2>
          <p>
            Cloudflare R2를 연결한 뒤 날짜별 여러 장 업로드, 대표 사진 지정,
            월별 앨범을 이 화면에 붙일 예정입니다.
          </p>
        </div>
      </Card>
    </main>
  )
}
