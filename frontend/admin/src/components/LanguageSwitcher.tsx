import { useLanguage } from '../contexts/LanguageContext';

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          currentLanguage === 'en'
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          currentLanguage === 'ar'
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        AR
      </button>
    </div>
  );
}

export default LanguageSwitcher;








