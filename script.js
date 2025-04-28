document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loggedUser = document.getElementById('logged-user');
    const appContent = document.getElementById('app-content');
    
    const komitety = [];
    const nazwaKomitetu = document.getElementById('nazwa-komitetu');
    const czyKoalicja = document.getElementById('czy-koalicja');
    const glosy = document.getElementById('glosy');
    const dodajKomitetBtn = document.getElementById('dodaj-komitet');
    const sprawdzWynikiBtn = document.getElementById('sprawdz-wyniki');
    const wyczyscDaneBtn = document.getElementById('wyczysc-dane');
    const zarejestrowanieKomitety = document.getElementById('zarejestrowane-komitety');
    const tabelaWynikow = document.getElementById('wyniki-tabela');
    const liczbaMandatowInput = document.getElementById('liczba-mandatow');
    const przeliczMandatyBtn = document.getElementById('przelicz-mandaty');
    const wykresContainer = document.getElementById('wykres-mandatow');
    
    checkLoginState();
    
    loginBtn.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            alert('Wprowadź nazwę użytkownika i hasło');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username] && users[username].password === password) {
            setLoggedUser(username);
            loadUserData(username);
        } else {
            alert('Nieprawidłowa nazwa użytkownika lub hasło');
        }
    });
    
    registerBtn.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            alert('Wprowadź nazwę użytkownika i hasło');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            alert('Użytkownik o tej nazwie już istnieje');
            return;
        }
        
        users[username] = { password: password };
        localStorage.setItem('users', JSON.stringify(users));
        
        setLoggedUser(username);
    });
    
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        loginForm.style.display = 'block';
        userInfo.style.display = 'none';
        appContent.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    });
    
    dodajKomitetBtn.addEventListener('click', function() {
        const nazwa = nazwaKomitetu.value.trim();
        const koalicja = czyKoalicja.checked;
        const liczbaGlosow = parseInt(glosy.value);
        
        if (!nazwa || isNaN(liczbaGlosow) || liczbaGlosow < 0) {
            alert('Proszę uzupełnić wszystkie pola poprawnie.');
            return;
        }
        
        komitety.push({
            nazwa,
            koalicja,
            glosy: liczbaGlosow,
            mandaty: 0
        });
        
        nazwaKomitetu.value = '';
        czyKoalicja.checked = false;
        glosy.value = '';

        wyswietlKomitety();
        saveUserData();
    });

    sprawdzWynikiBtn.addEventListener('click', function() {
        obliczWyniki();
        saveUserData();
    });
    
    przeliczMandatyBtn.addEventListener('click', function() {
        const liczbaMandatow = parseInt(liczbaMandatowInput.value);
        
        if (isNaN(liczbaMandatow) || liczbaMandatow < 1) {
            alert('Proszę wprowadzić poprawną liczbę mandatów.');
            return;
        }
        
        obliczMandaty(liczbaMandatow);
        generujWykresMandatow();
        saveUserData();
    });
    
    wyczyscDaneBtn.addEventListener('click', function() {
        if (confirm('Czy na pewno chcesz wyczyścić wszystkie dane?')) {
            komitety.length = 0;
            wyswietlKomitety();
            tabelaWynikow.innerHTML = '';
            wykresContainer.innerHTML = '';
            saveUserData();
        }
    });

    function wyswietlKomitety() {
        zarejestrowanieKomitety.innerHTML = '';
        
        komitety.forEach((komitet, indeks) => {
            const element = document.createElement('div');
            element.className = 'komitet-element';
            element.textContent = `${indeks + 1}. ${komitet.nazwa} ${komitet.koalicja ? 'jest koalicją' : 'nie jest koalicją'}, ilość głosów: ${komitet.glosy}`;
            
            const usunBtn = document.createElement('button');
            usunBtn.textContent = 'Usuń';
            usunBtn.className = 'usun-btn';
            usunBtn.addEventListener('click', function() {
                usunKomitet(indeks);
            });
            
            element.appendChild(usunBtn);
            zarejestrowanieKomitety.appendChild(element);
        });
    }

    function obliczWyniki() {
        tabelaWynikow.innerHTML = '';
        
        if (komitety.length === 0) {
            return;
        }
        
        const lacznaLiczbaGlosow = komitety.reduce((suma, komitet) => suma + komitet.glosy, 0);

        const wyniki = komitety.map(komitet => {
            return {
                ...komitet,
                prog: komitet.koalicja ? 8 : 5,
                procent: (komitet.glosy / lacznaLiczbaGlosow) * 100
            };
        });

        wyniki.sort((a, b) => b.procent - a.procent);

        wyniki.forEach((wynik, indeks) => {
            const wiersz = document.createElement('tr');
            wiersz.className = `wynik-wiersz-${indeks + 1}`;
            
            wiersz.innerHTML = `
                <td>${indeks + 1}</td>
                <td>${wynik.nazwa}</td>
                <td>${wynik.prog}</td>
                <td>${wynik.glosy}</td>
                <td>${wynik.procent.toFixed(2)}</td>
                <td>${wynik.mandaty || 0}</td>
            `;
            
            tabelaWynikow.appendChild(wiersz);
        });

        komitety.length = 0;
        wyniki.forEach(wynik => komitety.push(wynik));
    }
    
    function obliczMandaty(liczbaMandatow) {

        if (tabelaWynikow.children.length === 0) {
            obliczWyniki();
        }
        
        komitety.forEach(komitet => {
            komitet.mandaty = 0;
        });
        
        const komitetyPoPrzekroczeniuProgu = komitety.filter(komitet => 
            komitet.procent >= komitet.prog
        );
        
        if (komitetyPoPrzekroczeniuProgu.length === 0) {
            alert('Żaden komitet nie przekroczył progu wyborczego.');
            return;
        }

        const dzielniki = new Array(komitetyPoPrzekroczeniuProgu.length).fill(1);
        
        for (let m = 0; m < liczbaMandatow; m++) {
            const ilorazy = komitetyPoPrzekroczeniuProgu.map((komitet, i) => 
                komitet.glosy / dzielniki[i]
            );

            let maxIndex = 0;
            let maxWartosc = ilorazy[0];
            
            for (let i = 1; i < ilorazy.length; i++) {
                if (ilorazy[i] > maxWartosc) {
                    maxWartosc = ilorazy[i];
                    maxIndex = i;
                }
            }

            komitetyPoPrzekroczeniuProgu[maxIndex].mandaty++;

            dzielniki[maxIndex]++;
        }

        tabelaWynikow.innerHTML = '';
        
        komitety.forEach((komitet, indeks) => {
            const wiersz = document.createElement('tr');
            wiersz.className = `wynik-wiersz-${indeks + 1}`;
            
            wiersz.innerHTML = `
                <td>${indeks + 1}</td>
                <td>${komitet.nazwa}</td>
                <td>${komitet.prog}</td>
                <td>${komitet.glosy}</td>
                <td>${komitet.procent.toFixed(2)}</td>
                <td>${komitet.mandaty || 0}</td>
            `;
            
            tabelaWynikow.appendChild(wiersz);
        });
    }
    
    function generujWykresMandatow() {
        wykresContainer.innerHTML = '';

        const komitetyZMandatami = komitety.filter(komitet => komitet.mandaty > 0);
        
        if (komitetyZMandatami.length === 0) {
            return;
        }

        const kolory = [
            '#0066ff', '#dc3545', '#28a745', '#ffc107', '#6f42c1',
            '#20c997', '#fd7e14', '#6c757d', '#17a2b8', '#e83e8c'
        ];

        const divWykres = document.createElement('div');
        divWykres.className = 'wykres-paskowy';
        
        const totalMandaty = komitetyZMandatami.reduce((suma, komitet) => suma + komitet.mandaty, 0);
        
        komitetyZMandatami.forEach((komitet, indeks) => {
            const kolorIndeks = indeks % kolory.length;
            const procent = (komitet.mandaty / totalMandaty) * 100;
            
            const pasek = document.createElement('div');
            pasek.className = 'pasek';
            pasek.style.width = `${procent}%`;
            pasek.style.backgroundColor = kolory[kolorIndeks];
            pasek.setAttribute('title', `${komitet.nazwa}: ${komitet.mandaty} mandatów (${procent.toFixed(1)}%)`);
            divWykres.appendChild(pasek);
        });
        
        wykresContainer.appendChild(divWykres);

        const divLegenda = document.createElement('div');
        divLegenda.className = 'wykres-legenda';
        
        komitetyZMandatami.forEach((komitet, indeks) => {
            const kolorIndeks = indeks % kolory.length;
            
            const elementLegendy = document.createElement('div');
            elementLegendy.className = 'legenda-element';
            
            const kolorDot = document.createElement('span');
            kolorDot.className = 'legenda-kolor';
            kolorDot.style.backgroundColor = kolory[kolorIndeks];
            
            const tekst = document.createElement('span');
            tekst.textContent = `${komitet.nazwa}: ${komitet.mandaty} mandatów`;
            
            elementLegendy.appendChild(kolorDot);
            elementLegendy.appendChild(tekst);
            divLegenda.appendChild(elementLegendy);
        });
        
        wykresContainer.appendChild(divLegenda);

        const divWykresKolowy = document.createElement('div');
        divWykresKolowy.className = 'wykres-kolowy-container';

        const svgContainer = document.createElement('div');
        svgContainer.className = 'svg-container';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('class', 'wykres-kolowy');
        
        let startAngle = 0;
        
        komitetyZMandatami.forEach((komitet, indeks) => {
            const kolorIndeks = indeks % kolory.length;
            const procent = (komitet.mandaty / totalMandaty);
            const endAngle = startAngle + procent * 2 * Math.PI;

            const x1 = 50 + 40 * Math.cos(startAngle);
            const y1 = 50 + 40 * Math.sin(startAngle);
            const x2 = 50 + 40 * Math.cos(endAngle);
            const y2 = 50 + 40 * Math.sin(endAngle);

            const largeArcFlag = procent > 0.5 ? 1 : 0;
            
            const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
            ].join(' ');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', kolory[kolorIndeks]);
            path.setAttribute('title', `${komitet.nazwa}: ${komitet.mandaty} mandatów`);
            
            svg.appendChild(path);
            
            startAngle = endAngle;
        });
        
        svgContainer.appendChild(svg);
        divWykresKolowy.appendChild(svgContainer);
        wykresContainer.appendChild(divWykresKolowy);
    }
    
    function usunKomitet(indeks) {
        komitety.splice(indeks, 1);
        wyswietlKomitety();
        saveUserData();
    }
    
    function checkLoginState() {
        const currentUser = localStorage.getItem('currentUser');
        
        if (currentUser) {
            setLoggedUser(currentUser);
            loadUserData(currentUser);
        }
    }
    
    function setLoggedUser(username) {
        localStorage.setItem('currentUser', username);
        loginForm.style.display = 'none';
        userInfo.style.display = 'block';
        appContent.style.display = 'block';
        loggedUser.textContent = username;
    }
    
    function saveUserData() {
        const currentUser = localStorage.getItem('currentUser');
        
        if (currentUser) {
            const userData = {
                komitety: komitety,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem(`userData_${currentUser}`, JSON.stringify(userData));
        }
    }
    
    function loadUserData(username) {
        const userDataString = localStorage.getItem(`userData_${username}`);
        
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            
            komitety.length = 0;
            if (userData.komitety && Array.isArray(userData.komitety)) {
                userData.komitety.forEach(komitet => {
                    komitety.push(komitet);
                });
            }
            
            wyswietlKomitety();
            
            if (komitety.length > 0) {
                obliczWyniki();
            }
        }
    }
});