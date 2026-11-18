import { sb, $, state, materia, cor, errorMessage, safe } from "./config.js";
import { render } from "./app.js";
const suggestions = {
  Programação: [
    "Introdução à lógica de programação",
    "Algoritmos e pseudocódigo",
    "Variáveis e tipos de dados",
    "Estruturas condicionais",
    "Estruturas de repetição",
    "Funções",
    "Git e GitHub",
    "Automação com Python",
    "Pandas e análise de dados",
    "SQL e bancos de dados",
    "Fundamentos de IA",
    "Projeto final",
  ],
  Inglês: [
    "Alfabeto e pronúncia",
    "Cumprimentos e apresentações",
    "Vocabulário do cotidiano",
    "Listening",
    "Shadowing",
    "Perguntas e respostas",
    "Conversação guiada",
    "Rotina e hábitos",
    "Passado e futuro",
    "Conversação espontânea",
  ],
};
export async function ensureSubjects() {
  const u = state.user.id;
  const { data, error } = await sb
    .from("materias")
    .select("*")
    .eq("user_id", u)
    .order("id");
  if (error) throw error;
  if (data.length) return;
  const { error: insertError } = await sb.from("materias").upsert(
    [
      { user_id: u, nome: "Programação", cor: "#bcdcf5" },
      { user_id: u, nome: "Inglês", cor: "#c8e6d0" },
    ],
    { onConflict: "user_id,nome" },
  );
  if (insertError) throw insertError;
}
export function selectSubject(name) {
  if (state.running || state.elapsed > 0) {
    alert("Salve a sessão antes de trocar de matéria.");
    return;
  }
  state.subject = name;
  state.activeTaskId = "";
  document.documentElement.style.setProperty("--cor", cor());
  $("currentSubject").textContent = name;
  $("saveMessage").textContent = "";
  $("suggestions").innerHTML = (suggestions[name] || [])
    .map((v) => `<option value="${safe(v)}">`)
    .join("");
  renderTabs();
  render();
}
export function renderTabs() {
  const el = $("tabs");
  el.innerHTML = "";
  state.subjects.forEach((m) => {
    const group = document.createElement("div");
    group.className = "subject-tab";
    const button = document.createElement("button");
    button.textContent = m.nome;
    button.classList.toggle("active", m.nome === state.subject);
    button.style.backgroundColor = m.cor || "#bcdcf5";
    button.onclick = () => selectSubject(m.nome);
    const paint = document.createElement("label");
    paint.className = "paint-button";
    paint.title = "Alterar cor de " + m.nome;
    paint.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 14 9-9 6 6-9 9H4z"/><path d="m11 7 6 6"/></svg>';
    const picker = document.createElement("input");
    picker.type = "color";
    picker.className = "tab-color-input";
    picker.value = m.cor || "#bcdcf5";
    picker.setAttribute("aria-label", "Cor de " + m.nome);
    picker.onchange = async (e) => {
      const color = e.target.value;
      const { error } = await sb
        .from("materias")
        .update({ cor: color })
        .eq("id", m.id)
        .eq("user_id", state.user.id);
      if (error) {
        picker.value = m.cor;
        errorMessage(error);
        return;
      }
      m.cor = color;
      button.style.backgroundColor = color;
      if (state.subject === m.nome) {
        document.documentElement.style.setProperty("--cor", color);
        render();
      }
    };
    paint.appendChild(picker);
    
const excluir = document.createElement("button");
excluir.type = "button";
excluir.textContent = "×";
excluir.className = "small danger";
excluir.title = "Excluir " + m.nome;

excluir.onclick = async () => {
  if (state.running || state.elapsed > 0) {
    alert("Salve a sessão antes de excluir.");
    return;
  }

  if (!confirm(
    `Excluir "${m.nome}" e todos os seus registros?`
  )) return;

  const { error } = await sb
    .from("materias")
    .delete()
    .eq("id", m.id)
    .eq("user_id", state.user.id);

  if (error) {
    errorMessage(error);
    return;
  }

  state.subjects = state.subjects.filter(
    item => item.id !== m.id
  );

  state.tasks = state.tasks.filter(
    item => item.materia_id !== m.id
  );

  state.sessions = state.sessions.filter(
    item => item.materia_id !== m.id
  );

  if (state.subject === m.nome) {
    state.subject = state.subjects[0]?.nome || "";
  }

  renderTabs();
  render();
};

group.append(button, paint, excluir);

    el.appendChild(group);
  });
  const add = document.createElement("button");
  add.textContent = "+ Adicionar matéria";
  add.onclick = async () => {
    if (state.running || state.elapsed > 0) {
      alert("Salve a sessão antes de trocar de matéria.");
      return;
    }
    const name = prompt("Nome da nova matéria:")?.trim();
    if (!name) return;
    if (
      state.subjects.some((m) => m.nome.toLowerCase() === name.toLowerCase())
    ) {
      alert("Essa matéria já existe.");
      return;
    }
    const { data, error } = await sb
      .from("materias")
      .insert({ user_id: state.user.id, nome: name, cor: "#d7d5f5" })
      .select()
      .single();
    if (error) {
      errorMessage(error);
      return;
    }
    state.subjects.push(data);
    selectSubject(name);
  };
  el.appendChild(add);
}
