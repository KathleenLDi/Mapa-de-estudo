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
    button.type = "button";
    button.className = "subject-name";
    button.textContent = m.nome;
    button.classList.toggle(
      "active",
      m.nome === state.subject
    );
    button.style.backgroundColor = m.cor || "#bcdcf5";
    button.onclick = () => selectSubject(m.nome);

    const arrow = document.createElement("button");
    arrow.type = "button";
    arrow.className = "subject-arrow";
    arrow.textContent = "⌄";
    arrow.title = "Opções de " + m.nome;
    arrow.setAttribute(
      "aria-label",
      "Opções de " + m.nome
    );
    arrow.setAttribute("aria-expanded", "false");
    arrow.style.backgroundColor = m.cor || "#bcdcf5";

    const menu = document.createElement("div");
    menu.className = "subject-menu hide";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Editar nome";

    edit.onclick = async () => {
      const name = prompt(
        "Novo nome da matéria:",
        m.nome
      )?.trim();

      if (!name || name === m.nome) return;

      if (state.subjects.some(item =>
        item.id !== m.id &&
        item.nome.toLowerCase() === name.toLowerCase()
      )) {
        alert("Essa matéria já existe.");
        return;
      }

      const oldName = m.nome;

      const { error } = await sb
        .from("materias")
        .update({ nome: name })
        .eq("id", m.id)
        .eq("user_id", state.user.id);

      if (error) {
        errorMessage(error);
        return;
      }

      m.nome = name;

      if (state.subject === oldName) {
        state.subject = name;
      }

      renderTabs();
      render();
    };

    const colorLabel = document.createElement("label");
    colorLabel.className = "menu-color-label";
    colorLabel.textContent = "Alterar cor";

    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = m.cor || "#bcdcf5";
    picker.setAttribute(
      "aria-label",
      "Cor de " + m.nome
    );

    picker.onchange = async (event) => {
      const color = event.target.value;

      const { error } = await sb
        .from("materias")
        .update({ cor: color })
        .eq("id", m.id)
        .eq("user_id", state.user.id);

      if (error) {
        picker.value = m.cor || "#bcdcf5";
        errorMessage(error);
        return;
      }

      m.cor = color;
      button.style.backgroundColor = color;
      arrow.style.backgroundColor = color;

      if (state.subject === m.nome) {
        document.documentElement.style.setProperty(
          "--cor",
          color
        );
        render();
      }
    };

    colorLabel.appendChild(picker);

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "Excluir matéria";
    excluir.className = "menu-danger";

    excluir.onclick = async () => {
      if (state.running || state.elapsed > 0) {
        alert("Salve a sessão antes de excluir.");
        return;
      }

      if (!confirm(
        `Excluir "${m.nome}" e seus registros?`
      )) return;

      // Apaga primeiro as sessões vinculadas.
      const { error: sessionError } = await sb
        .from("sessoes_estudo")
        .delete()
        .eq("materia_id", m.id)
        .eq("user_id", state.user.id);

      if (sessionError) {
        errorMessage(sessionError);
        return;
      }

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

      if (state.subjects.length) {
        selectSubject(state.subject);
      } else {
        document.documentElement.style.setProperty(
          "--cor",
          "#bcdcf5"
        );
        $("currentSubject").textContent = "";
        renderTabs();
        render();
      }
    };

    menu.append(edit, colorLabel, excluir);

    arrow.onclick = (event) => {
      event.stopPropagation();

      document
        .querySelectorAll(".subject-menu")
        .forEach(other => {
          if (other !== menu) {
            other.classList.add("hide");
          }
        });

      menu.classList.toggle("hide");

      arrow.setAttribute(
        "aria-expanded",
        String(!menu.classList.contains("hide"))
      );
    };

    group.append(button, arrow, menu);
    el.appendChild(group);
  });

  const add = document.createElement("button");
  add.type = "button";
  add.textContent = "+ Adicionar matéria";

  add.onclick = async () => {
    if (state.running || state.elapsed > 0) {
      alert("Salve a sessão antes de trocar de matéria.");
      return;
    }

    const name = prompt(
      "Nome da nova matéria:"
    )?.trim();

    if (!name) return;

    if (state.subjects.some(m =>
      m.nome.toLowerCase() === name.toLowerCase()
    )) {
      alert("Essa matéria já existe.");
      return;
    }

    const { data, error } = await sb
      .from("materias")
      .insert({
        user_id: state.user.id,
        nome: name,
        cor: "#d7d5f5"
      })
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
