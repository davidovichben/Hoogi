import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Questionnaire, Question, QuestionOption, DEFAULT_META } from '../models/questionnaire.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {
  constructor(private supabaseService: SupabaseService) {}

  // Helper function to normalize questionnaire with safe meta defaults
  private normalizeQuestionnaire(q: any): Questionnaire {
    return {
      ...q,
      meta: (q && typeof q.meta === 'object' && q.meta !== null) ? q.meta : DEFAULT_META,
    };
  }

  async fetchQuestionnaireForReview(id: string) {
    const supabase = this.supabaseService.client;

    const [qResult, qsResult] = await Promise.all([
      supabase.from('questionnaires').select('*').eq('id', id).maybeSingle(),
      supabase.from('questions').select('*').eq('questionnaire_id', id).order('order_index', { ascending: true }),
    ]);

    if (qResult.error) throw qResult.error;
    if (qsResult.error) throw qsResult.error;
    if (!qResult.data) return null;

    // Load options if we have questions
    const options: any[] = [];
    if (qsResult.data && qsResult.data.length > 0) {
      const questionIds = qsResult.data.map((q: any) => q.id);
      const optsResult = await supabase
        .from('question_options')
        .select('*')
        .in('question_id', questionIds)
        .order('order_index', { ascending: true });
      if (optsResult.error) throw optsResult.error;
      if (optsResult.data) {
        options.push(...optsResult.data);
      }
    }

    return {
      questionnaire: this.normalizeQuestionnaire(qResult.data),
      questions: qsResult.data || [],
      options
    };
  }

  async fetchQuestionnaireByToken(token: string) {
    const supabase = this.supabaseService.client;

    // First, check if token starts with 'd_' (distribution token) or 'q_' (questionnaire token)
    let qData: any = null;

    if (token.startsWith('d_')) {
      // It's a distribution token - fetch from distributions table
      const { data: distData, error: distError } = await supabase
        .from('distributions')
        .select('questionnaire_id, questionnaires(*)')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (distError) throw distError;
      if (!distData) return null;

      qData = distData.questionnaires;
    } else {
      // It's a questionnaire token - fetch from questionnaires table (legacy support)
      const { data: questionnaireData, error: qError } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (qError) throw qError;
      qData = questionnaireData;
    }

    if (!qData) return null;

    // Then get questions
    const { data: qsData, error: qsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', qData.id)
      .order('order_index', { ascending: true });

    if (qsError) throw qsError;

    // Load options if we have questions
    const options: any[] = [];
    if (qsData && qsData.length > 0) {
      const questionIds = qsData.map((q: any) => q.id);
      const { data: optsData, error: optsError } = await supabase
        .from('question_options')
        .select('*')
        .in('question_id', questionIds)
        .order('order_index', { ascending: true });

      if (optsError) throw optsError;
      if (optsData) {
        options.push(...optsData);
      }
    }

    return {
      questionnaire: this.normalizeQuestionnaire(qData),
      questions: qsData || [],
      options
    };
  }

  async updateQuestionnaireMeta(id: string, payload: any) {
    const supabase = this.supabaseService.client;

    const { data: current, error: e0 } = await supabase
      .from('questionnaires')
      .select('id, meta')
      .eq('id', id)
      .maybeSingle();

    if (e0) throw e0;

    const meta = { ...(current?.meta || {}), ...payload };
    const { error } = await supabase.from('questionnaires').update({ meta }).eq('id', id);

    if (error) throw error;
    return true;
  }

  async applyQuickEdit(questionId: string, patch: any) {
    const supabase = this.supabaseService.client;
    const { error } = await supabase.from('questions').update(patch).eq('id', questionId);
    if (error) throw error;
    return true;
  }

  async reorderQuestions(questionIdsInOrder: string[]) {
    const supabase = this.supabaseService.client;
    await Promise.all(
      questionIdsInOrder.map((qid, idx) =>
        supabase.from('questions').update({ order_index: idx }).eq('id', qid)
      )
    );
    return true;
  }

  async reorderOptions(questionId: string, optionIdsInOrder: string[]) {
    const supabase = this.supabaseService.client;
    await Promise.all(
      optionIdsInOrder.map((oid, idx) =>
        supabase.from('question_options').update({ order_index: idx }).eq('id', oid)
      )
    );
    return true;
  }

  async duplicateQuestionnaireToLanguage(qId: string, fromLang: string, toLang: string) {
    const supabase = this.supabaseService.client;
    const { data: qs, error } = await supabase.from('questions').select('id, meta').eq('questionnaire_id', qId);

    if (error) throw error;

    await Promise.all(
      (qs || []).map((q: any) => {
        const meta = q.meta || {};
        const tr = meta.translations || {};
        tr[toLang] = tr[fromLang] || tr.default || {};
        return supabase.from('questions').update({ meta: { ...meta, translations: tr } }).eq('id', q.id);
      })
    );

    return true;
  }

  async setQuestionnaireStatus(id: string, status: 'draft' | 'published') {
    const supabase = this.supabaseService.client;
    const { error } = await supabase.from('questionnaires').update({
      meta: { status }
    }).eq('id', id);

    if (error) throw error;
    return true;
  }

  async publishQuestionnaire(id: string, signal?: AbortSignal): Promise<boolean> {
    try {
      if (signal?.aborted) {
        return false;
      }

      const supabase = this.supabaseService.client;
      const { error } = await supabase
        .from('questionnaires')
        .update({ meta: { status: 'published' } })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error publishing questionnaire:', error);
      throw error;
    }
  }

  async createQuestionnaire(questionnaire: Partial<Questionnaire>) {
    const supabase = this.supabaseService.client;
    const { data, error } = await supabase
      .from('questionnaires')
      .insert([questionnaire])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuestionnaire(id: string, updates: Partial<Questionnaire>) {
    const supabase = this.supabaseService.client;
    const { data, error } = await supabase
      .from('questionnaires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteQuestionnaire(id: string) {
    const supabase = this.supabaseService.client;
    const { error } = await supabase.from('questionnaires').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async fetchUserQuestionnaires(userId: string) {
    const supabase = this.supabaseService.client;
    const { data, error } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(q => this.normalizeQuestionnaire(q));
  }

  async createQuestion(question: Partial<Question>) {
    const supabase = this.supabaseService.client;
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuestion(id: string, updates: Partial<Question>) {
    const supabase = this.supabaseService.client;
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteQuestion(id: string) {
    const supabase = this.supabaseService.client;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
