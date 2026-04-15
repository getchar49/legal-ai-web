export const CHAT_UI_VISIBILITY = {
  headerNav: {
    showDashboard: true,
    showAnalytics: false,
    showTeam: false,
  },
  headerActions: {
    // Nút icon cạnh "Đăng xuất" đang được ẩn tạm thời vì chưa có tương tác.
    showHomeShortcut: false,
    // Ô tìm kiếm vụ việc đang được ẩn tạm thời.
    showCaseSearch: false,
    // Nút chuông thông báo đang được ẩn tạm thời.
    showNotifications: false,
  },
  sidebar: {
    // Template mẫu đang được ẩn tạm thời.
    showLaborContractTemplate: false,
    // Khi không có tài liệu thì ẩn luôn tiêu đề "Tài liệu gần đây".
    showRecentDocumentsWhenEmpty: false,
    // Các mục tiện ích đang được ẩn tạm thời.
    showSettings: false,
    showSupport: false,
  },
  messageInput: {
    // Template lĩnh vực pháp luật đang được ẩn tạm thời.
    showTopicTemplates: false,
    // Nút tải tệp lên đang được ẩn tạm thời.
    showAttachFile: false,
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
