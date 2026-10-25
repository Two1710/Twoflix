import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiDownload, FiMonitor, FiSmartphone, FiWifi } from 'react-icons/fi';
import './DownloadPage.css';

const APPS = [
  {
    title: 'TwoFlix cho Android',
    description: 'Thưởng thức phim trên điện thoại và máy tính bảng Android.',
    file: '/downloads/twoflix-android.apk',
    label: 'Tải APK Android',
    icon: FiSmartphone,
    className: 'download-card--mobile',
    details: ['Tối ưu cho màn hình cảm ứng', 'Cài đặt trực tiếp bằng tệp APK'],
  },
  {
    title: 'TwoFlix cho Android TV',
    description: 'Giao diện dành cho TV, điều khiển thuận tiện bằng remote.',
    file: '/downloads/twoflix-android-tv.apk',
    label: 'Tải APK Android TV',
    icon: FiMonitor,
    className: 'download-card--tv',
    details: ['Hỗ trợ điều hướng bằng remote', 'Tối ưu hiển thị màn hình lớn'],
  },
];

export default function DownloadPage() {
  return (
    <main className="download-page">
      <div className="download-page__glow download-page__glow--one" />
      <div className="download-page__glow download-page__glow--two" />
      <div className="download-page__content">
        <Link to="/" className="download-page__back"><FiArrowLeft /> Quay lại TwoFlix</Link>
        <section className="download-hero">
          <span className="download-hero__eyebrow"><FiDownload /> TWOFLIX APPS</span>
          <h1>Mang TwoFlix<br /><span>lên màn hình của bạn</span></h1>
          <p>Chọn phiên bản phù hợp với thiết bị để bắt đầu trải nghiệm.</p>
        </section>

        <section className="download-grid" aria-label="Chọn ứng dụng để tải">
          {APPS.map(({ title, description, file, label, icon: Icon, className, details }) => (
            <article className={`download-card ${className}`} key={title}>
              <div className="download-card__top">
                <div className="download-card__icon"><Icon /></div>
                <span className="download-card__platform">ANDROID APK</span>
              </div>
              <h2>{title}</h2>
              <p className="download-card__description">{description}</p>
              <ul className="download-card__details">
                {details.map(detail => <li key={detail}><FiCheck /> {detail}</li>)}
              </ul>
              <a className="download-card__button" href={file} download>
                <FiDownload /> {label}
              </a>
            </article>
          ))}
        </section>

        <p className="download-note"><FiWifi /> Cần kết nối Internet để xem phim và tải nội dung từ dịch vụ trực tuyến.</p>
      </div>
    </main>
  );
}
