import 'package:flutter/material.dart';
import 'package:bella_app/core/routes/app_router.dart';
import 'package:bella_app/core/styles/app_theme.dart';
import 'package:bella_app/core/utils/logger.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Configure logging
  Logger.configure();
  
  runApp(const BellaApp());
}

class BellaApp extends StatelessWidget {
  const BellaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Bella App',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: AppRouter.router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaleFactor: 1.0),
          child: child!,
        );
      },
    );
  }
}