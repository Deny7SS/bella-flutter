import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

part 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  AuthCubit() : super(AuthInitial());

  final SupabaseClient _supabase = Supabase.instance.client;

  Future<void> login(String email, String password) async {
    emit(AuthLoading());
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      if (response.user != null) {
        emit(AuthSuccess());
      } else {
        emit(const AuthError('Falha no login'));
      }
    } on AuthException catch (e) {
      emit(AuthError(e.message));
    } catch (e) {
      emit(const AuthError('Erro desconhecido'));
    }
  }

  Future<void> register(String email, String password, String name) async {
    emit(AuthLoading());
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'name': name},
      );
      
      if (response.user != null) {
        emit(AuthSuccess());
      } else {
        emit(const AuthError('Falha no registro'));
      }
    } on AuthException catch (e) {
      emit(AuthError(e.message));
    } catch (e) {
      emit(const AuthError('Erro desconhecido'));
    }
  }

  Future<void> logout() async {
    try {
      await _supabase.auth.signOut();
      emit(AuthInitial());
    } catch (e) {
      emit(const AuthError('Falha ao sair'));
    }
  }
}