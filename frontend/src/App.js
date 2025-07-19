import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios defaults
axios.defaults.headers.common['Authorization'] = localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [challenges, setChallenges] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({});
  const [matchingResults, setMatchingResults] = useState(null);

  // Auth forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    type: 'aluno',
    shareExpectations: false,
    expectations: ''
  });
  
  // Challenge form
  const [challengeForm, setChallengeForm] = useState({ title: '', description: '', deadline: '', reward: '' });
  
  // Solution form
  const [solutionForm, setSolutionForm] = useState({ description: '' });

  // Predefined expectations data
  const companyExpectations = [
    "Adaptabilidade e Resiliência",
    "Pensamento Crítico e Resolução de Problemas",
    "Competências Digitais e Tecnológicas",
    "Trabalho em Equipe e Colaboração",
    "Comunicação Eficaz",
    "Criatividade e Inovação",
    "Inteligência Emocional",
    "Consciência Cultural e Diversidade",
    "Aprendizado Contínuo",
    "Ética e Responsabilidade"
  ];

  const studentExpectations = [
    "Planos de Saúde e Benefícios",
    "Horário Flexível e Trabalho Remoto",
    "Oportunidades de Crescimento Profissional",
    "Ambiente Inclusivo e Diverso",
    "Tecnologia e Inovação",
    "Propósito e Responsabilidade Social",
    "Feedback Regular e Reconhecimento",
    "Vale-Alimentação e Auxílios",
    "Cultura Colaborativa",
    "Sustentabilidade Empresarial"
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    }
    fetchChallenges();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('token');
      axios.defaults.headers.common['Authorization'] = '';
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(`${API}/challenges`);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchSolutions = async (challengeId) => {
    try {
      const response = await axios.get(`${API}/challenges/${challengeId}/solutions`);
      setSolutions(response.data);
    } catch (error) {
      console.error('Error fetching solutions:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMatchingAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/matching-analysis`);
      setMatchingResults(response.data);
    } catch (error) {
      console.error('Error fetching matching analysis:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/login`, loginForm);
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      setCurrentView('challenges');
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      alert('Erro no login: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/register`, registerForm);
      // Auto login after registration
      const loginResponse = await axios.post(`${API}/login`, {
        email: registerForm.email,
        password: registerForm.password
      });
      localStorage.setItem('token', loginResponse.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
      setUser(loginResponse.data.user);
      setCurrentView('challenges');
      setRegisterForm({ 
        name: '', 
        email: '', 
        password: '', 
        type: 'aluno',
        shareExpectations: false,
        expectations: ''
      });
    } catch (error) {
      alert('Erro no registro: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    axios.defaults.headers.common['Authorization'] = '';
    setUser(null);
    setCurrentView('home');
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/challenges`, challengeForm);
      setChallengeForm({ title: '', description: '', deadline: '', reward: '' });
      fetchChallenges();
      alert('Desafio criado com sucesso!');
    } catch (error) {
      alert('Erro ao criar desafio: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleCreateSolution = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/solutions`, {
        challenge_id: selectedChallenge.id,
        description: solutionForm.description
      });
      setSolutionForm({ description: '' });
      fetchSolutions(selectedChallenge.id);
      alert('Solução enviada com sucesso!');
    } catch (error) {
      alert('Erro ao enviar solução: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const handleVote = async (solutionId) => {
    try {
      await axios.post(`${API}/solutions/${solutionId}/vote`);
      fetchSolutions(selectedChallenge.id);
      fetchProfile(); // Update user points
      alert('Voto registrado com sucesso!');
    } catch (error) {
      alert('Erro ao votar: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    }
  };

  const renderHome = () => (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Plataforma de Inovação PUC-RS</h1>
          <p>Conectando talentos universitários com oportunidades empresariais através de inovação e tecnologia</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <h3>{stats.total_challenges || 0}</h3>
              <p>Desafios Ativos</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💡</div>
              <h3>{stats.total_solutions || 0}</h3>
              <p>Soluções Enviadas</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <h3>{stats.total_users || 0}</h3>
              <p>Usuários Ativos</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <h3>{stats.total_votes || 0}</h3>
              <p>Votos Registrados</p>
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="auth-section">
          <div className="auth-container">
            <div className="auth-forms">
              <div className="auth-form">
                <h2>Entrar na Plataforma</h2>
                <form onSubmit={handleLogin}>
                  <input
                    type="email"
                    placeholder="Seu email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Sua senha"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    required
                  />
                  <button type="submit" className="submit-btn">
                    <span>Entrar</span>
                  </button>
                </form>
              </div>

              <div className="auth-form">
                <h2>Cadastre-se Agora</h2>
                <form onSubmit={handleRegister}>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email institucional/profissional"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Crie uma senha segura"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    required
                  />
                  <select
                    value={registerForm.type}
                    onChange={(e) => setRegisterForm({...registerForm, type: e.target.value})}
                    required
                  >
                    <option value="aluno">🎓 Estudante/Formando</option>
                    <option value="professor">👨‍🏫 Professor/Orientador</option>
                    <option value="empresa">🏢 Empresa/Recrutador</option>
                  </select>
                  
                  <div className="expectations-section">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={registerForm.shareExpectations}
                        onChange={(e) => setRegisterForm({...registerForm, shareExpectations: e.target.checked})}
                      />
                      <span className="checkmark"></span>
                      {registerForm.type === 'empresa' 
                        ? 'Compartilhar expectativas sobre formandos' 
                        : registerForm.type === 'aluno' 
                        ? 'Compartilhar expectativas sobre empresas' 
                        : 'Participar do sistema de matching'}
                    </label>
                    
                    {registerForm.shareExpectations && (
                      <div className="expectations-input">
                        <label>
                          {registerForm.type === 'empresa' 
                            ? 'O que sua empresa espera dos recém-formados?' 
                            : registerForm.type === 'aluno' 
                            ? 'O que você busca numa empresa?' 
                            : 'Suas expectativas:'}
                        </label>
                        <div className="suggestions">
                          <small>Sugestões: {registerForm.type === 'empresa' ? companyExpectations.join(', ') : studentExpectations.join(', ')}</small>
                        </div>
                        <textarea
                          placeholder={registerForm.type === 'empresa' 
                            ? 'Descreva as competências, habilidades e características que sua empresa valoriza em novos talentos...' 
                            : registerForm.type === 'aluno' 
                            ? 'Descreva o ambiente de trabalho, benefícios e cultura empresarial que você procura...' 
                            : 'Descreva suas expectativas...'}
                          value={registerForm.expectations}
                          onChange={(e) => setRegisterForm({...registerForm, expectations: e.target.value})}
                          rows="4"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    <span>Criar Conta</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderChallenges = () => (
    <div className="challenges-container">
      <div className="page-header">
        <div className="header-content">
          <h2>Desafios de Inovação</h2>
          <p>Explore oportunidades para aplicar seu conhecimento em projetos reais</p>
        </div>
        {user && (user.type === 'professor' || user.type === 'empresa') && (
          <button onClick={() => setCurrentView('create-challenge')} className="primary-btn">
            <span>+ Criar Desafio</span>
          </button>
        )}
      </div>
      
      <div className="challenges-grid">
        {challenges.map(challenge => (
          <div key={challenge.id} className="challenge-card">
            <div className="card-header">
              <h3>{challenge.title}</h3>
              <div className="creator-badge">
                {challenge.creator_name}
              </div>
            </div>
            <p className="challenge-description">{challenge.description}</p>
            <div className="challenge-meta">
              {challenge.deadline && (
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span>Prazo: {new Date(challenge.deadline).toLocaleDateString()}</span>
                </div>
              )}
              {challenge.reward && (
                <div className="meta-item">
                  <span className="meta-icon">🏆</span>
                  <span>{challenge.reward}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                setSelectedChallenge(challenge);
                fetchSolutions(challenge.id);
                setCurrentView('solutions');
              }}
              className="secondary-btn"
            >
              Ver Soluções & Participar
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateChallenge = () => (
    <div className="create-form-container">
      <div className="form-header">
        <h2>Criar Novo Desafio</h2>
        <p>Proponha um desafio inovador para a comunidade acadêmica</p>
      </div>
      <form onSubmit={handleCreateChallenge} className="create-form">
        <div className="form-group">
          <label>Título do Desafio</label>
          <input
            type="text"
            placeholder="Ex: Sistema de Gestão Sustentável"
            value={challengeForm.title}
            onChange={(e) => setChallengeForm({...challengeForm, title: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Descrição Detalhada</label>
          <textarea
            placeholder="Descreva o desafio, contexto, objetivos e resultados esperados..."
            value={challengeForm.description}
            onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
            required
            rows="6"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Data Limite (Opcional)</label>
            <input
              type="date"
              value={challengeForm.deadline}
              onChange={(e) => setChallengeForm({...challengeForm, deadline: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Recompensa (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: R$ 5.000 + Estágio"
              value={challengeForm.reward}
              onChange={(e) => setChallengeForm({...challengeForm, reward: e.target.value})}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" onClick={() => setCurrentView('challenges')} className="secondary-btn">
            Cancelar
          </button>
          <button type="submit" className="primary-btn">
            Publicar Desafio
          </button>
        </div>
      </form>
    </div>
  );

  const renderSolutions = () => (
    <div className="solutions-container">
      <div className="page-header">
        <div className="header-content">
          <h2>{selectedChallenge?.title}</h2>
          <p>{selectedChallenge?.description}</p>
        </div>
        <button onClick={() => setCurrentView('challenges')} className="secondary-btn">
          ← Voltar aos Desafios
        </button>
      </div>

      {user && (
        <div className="solution-form-container">
          <h3>💡 Envie Sua Solução</h3>
          <form onSubmit={handleCreateSolution} className="solution-form">
            <textarea
              placeholder="Descreva sua solução inovadora, metodologia, tecnologias utilizadas e resultados esperados..."
              value={solutionForm.description}
              onChange={(e) => setSolutionForm({...solutionForm, description: e.target.value})}
              required
              rows="5"
            />
            <button type="submit" className="primary-btn">
              Enviar Solução
            </button>
          </form>
        </div>
      )}

      <div className="solutions-section">
        <h3>🏆 Soluções Submetidas ({solutions.length})</h3>
        <div className="solutions-list">
          {solutions.map((solution, index) => (
            <div key={solution.id} className="solution-card">
              <div className="solution-header">
                <div className="solution-rank">#{index + 1}</div>
                <div className="solution-author">
                  <h4>{solution.author_name}</h4>
                  <small>Enviado em {new Date(solution.submission_date).toLocaleDateString()}</small>
                </div>
                <div className="solution-votes">
                  <span className="votes-count">{solution.votes} votos</span>
                  {user && user.id !== solution.author_id && (
                    <button onClick={() => handleVote(solution.id)} className="vote-btn">
                      👍 Votar
                    </button>
                  )}
                </div>
              </div>
              <div className="solution-content">
                <p>{solution.description}</p>
              </div>
            </div>
          ))}
          {solutions.length === 0 && (
            <div className="empty-state">
              <p>Nenhuma solução submetida ainda. Seja o primeiro! 🚀</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => {
    // Fetch leaderboard data when component mounts or view changes
    if (leaderboard.length === 0) {
      fetchLeaderboard();
    }

    return (
      <div className="leaderboard-container">
        <div className="page-header">
          <div className="header-content">
            <h2>🏆 Ranking de Inovadores</h2>
            <p>Conheça os talentos mais ativos da plataforma</p>
          </div>
        </div>
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => (
            <div key={player.id} className={`leaderboard-item ${index < 3 ? 'podium' : ''}`}>
              <div className="rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="player-info">
                <h4>{player.name}</h4>
                <span className="player-type">{player.type}</span>
              </div>
              <div className="points">{player.points} pts</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMatching = () => {
    if (!matchingResults) {
      fetchMatchingAnalysis();
    }

    return (
      <div className="matching-container">
        <div className="page-header">
          <div className="header-content">
            <h2>🤝 Análise de Matching</h2>
            <p>Compatibilidade entre expectativas de empresas e formandos</p>
          </div>
          <button onClick={fetchMatchingAnalysis} className="primary-btn">
            🔄 Atualizar Análise
          </button>
        </div>

        {matchingResults && (
          <div className="matching-results">
            <div className="matching-stats">
              <div className="stat-card">
                <h3>{matchingResults.totalMatches}%</h3>
                <p>Compatibilidade Geral</p>
              </div>
              <div className="stat-card">
                <h3>{matchingResults.topMatches?.length || 0}</h3>
                <p>Combinações Ideais</p>
              </div>
              <div className="stat-card">
                <h3>{matchingResults.companies || 0}</h3>
                <p>Empresas Participantes</p>
              </div>
              <div className="stat-card">
                <h3>{matchingResults.students || 0}</h3>
                <p>Formandos Participantes</p>
              </div>
            </div>

            <div className="matching-sections">
              <div className="matching-section">
                <h3>🎯 Expectativas das Empresas</h3>
                <div className="expectations-list">
                  {matchingResults.companyExpectations?.map((item, index) => (
                    <div key={index} className="expectation-item">
                      <span className="expectation-text">{item.expectation}</span>
                      <div className="expectation-bar">
                        <div 
                          className="expectation-fill" 
                          style={{width: `${item.percentage}%`}}
                        ></div>
                      </div>
                      <span className="expectation-percentage">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="matching-section">
                <h3>💼 Expectativas dos Formandos</h3>
                <div className="expectations-list">
                  {matchingResults.studentExpectations?.map((item, index) => (
                    <div key={index} className="expectation-item">
                      <span className="expectation-text">{item.expectation}</span>
                      <div className="expectation-bar">
                        <div 
                          className="expectation-fill student" 
                          style={{width: `${item.percentage}%`}}
                        ></div>
                      </div>
                      <span className="expectation-percentage">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {matchingResults.topMatches && (
              <div className="top-matches">
                <h3>✨ Melhores Combinações</h3>
                <div className="matches-grid">
                  {matchingResults.topMatches.map((match, index) => (
                    <div key={index} className="match-card">
                      <div className="match-score">{match.score}%</div>
                      <h4>{match.commonExpectations}</h4>
                      <p>Características compatíveis encontradas</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>PUC-RS Inovação</h1>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => setCurrentView('home')} 
            className={currentView === 'home' ? 'active' : ''}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentView('challenges')} 
            className={currentView === 'challenges' ? 'active' : ''}
          >
            Desafios
          </button>
          <button 
            onClick={() => setCurrentView('leaderboard')} 
            className={currentView === 'leaderboard' ? 'active' : ''}
          >
            Ranking
          </button>
          <button 
            onClick={() => setCurrentView('matching')} 
            className={currentView === 'matching' ? 'active' : ''}
          >
            Matching
          </button>
          {user && (
            <div className="user-info">
              <span>Olá, {user.name}! ({user.points} pts)</span>
              <button onClick={handleLogout} className="logout-btn">Sair</button>
            </div>
          )}
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'home' && renderHome()}
        {currentView === 'challenges' && renderChallenges()}
        {currentView === 'create-challenge' && renderCreateChallenge()}
        {currentView === 'solutions' && renderSolutions()}
        {currentView === 'leaderboard' && renderLeaderboard()}
        {currentView === 'matching' && renderMatching()}
      </main>
    </div>
  );
}

export default App;