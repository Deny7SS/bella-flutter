class Logger {
  static void configure() {
    // Configure logging for development
  }

  static void info(String message, {String? tag}) {
    print('[INFO]${tag != null ? ' [$tag]' : ''}: $message');
  }

  static void debug(String message, {String? tag}) {
    print('[DEBUG]${tag != null ? ' [$tag]' : ''}: $message');
  }

  static void warning(String message, {String? tag}) {
    print('[WARNING]${tag != null ? ' [$tag]' : ''}: $message');
  }

  static void error(String message, {String? tag, dynamic error}) {
    print('[ERROR]${tag != null ? ' [$tag]' : ''}: $message');
    if (error != null) {
      print('Error details: $error');
    }
  }
}