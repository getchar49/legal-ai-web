export const CHAT_UI_VISIBILITY = {
  headerNav: {
    showDashboard: true,
    showAnalytics: false,
    showTeam: false,
  },
  headerActions: {
    // Nút icon cạnh "Đăng xuất" đang được ẩn tạm thời vì chưa có tương tác.
    showHomeShortcut: false,
  },
  sidebar: {
    // Template mẫu đang được ẩn tạm thời.
    showLaborContractTemplate: false,
    // Khi không có tài liệu thì ẩn luôn tiêu đề "Tài liệu gần đây".
    showRecentDocumentsWhenEmpty: false,
  },
  history: {
    titleMaxLength: 72,
  },
} as const;

export const GENERIC_HISTORY_TITLE_PATTERNS = [
  /^cuoc tro chuyen\s*\d+$/i,
  /^cuộc trò chuyện\s*\d+$/i,
  /^conversation\s*\d+$/i,
];
