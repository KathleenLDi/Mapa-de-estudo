import {
  sb,
  $,
  state,
  materia,
  safe,
  formatDate,
  localDate,
  fmt,
  errorMessage,
} from "./config.js";
import { render } from "./app.js";
export function renderHistory() {
  const m = materia();
  const filtered = state.sessions
    .filter((s) => s.materia_id === m?.id)
    .slice()
    .reverse();
  $("history").innerHTML = filtered.length
    ? filtered
        .map((s) => {
          const task = state.tasks.find((t) => t.id === s.atividade_id);
          const content = task?.titulo || "Estudo registrado";
          const date = localDate(new Date(s.inicio || s.created_at));
          return `<div class="history-item"><div class="history-info"><strong>${safe(content)}</strong><div class="muted">${formatDate(date)} · ${fmt(Number(s.duracao_segundos || 0))}</div>${s.observacoes ? `<p>${safe(s.observacoes)}</p>` : ""}</div><button class="small danger" data-session-del="${s.id}">Excluir</button></div>`;
        })
        .join("")
    : '<p class="muted">Nenhuma sessão registrada.</p>';
}
export function initHistorico() {
  $("history").onclick = async (e) => {
    const button = e.target.closest("[data-session-del]");
    if (!button || !confirm("Excluir esta sessão?")) return;
    const id = Number(button.dataset.sessionDel);
    const { error } = await sb
      .from("sessoes_estudo")
      .delete()
      .eq("id", id)
      .eq("user_id", state.user.id);
    if (error) {
      errorMessage(error);
      return;
    }
    state.sessions = state.sessions.filter((s) => s.id !== id);
    render();
  };
}
