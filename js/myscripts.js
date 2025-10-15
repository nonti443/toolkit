let thaiIdResults = [];
let guidResults = [];
let nameResults = [];
let customNumberResults = [];
let formatterHistory = [];
let generatedThaiIds = new Set();

// --- Name Data (to be populated from data.json) ---
let firstNamesFemaleTh = [], firstNamesFemaleEn = [];
let firstNamesMaleTh = [], firstNamesMaleEn = [];
let allLastNamesTh = [], allLastNamesEn = [];
let nicknamesFemaleTh = [], nicknamesFemaleEn = [];
let nicknamesMaleTh = [], nicknamesMaleEn = [];
let allFirstNamesTh = [], allFirstNamesEn = [];
let allNicknamesTh = [], allNicknamesEn = [];

async function loadNameData() {
    const generateNameBtn = document.getElementById('generateNameBtn');
    const originalBtnText = generateNameBtn.innerHTML;
    generateNameBtn.disabled = true;
    generateNameBtn.innerHTML = '⏳ กำลังโหลดข้อมูล...';

    try {
        const response = await fetch('data.json'); // Assuming data.json is in the same directory
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        data.firstnameFemale.forEach(name => {
            if (name.th) firstNamesFemaleTh.push(name.th);
            if (name.en) firstNamesFemaleEn.push(name.en);
        });
        data.firstnameMale.forEach(name => {
            if (name.th) firstNamesMaleTh.push(name.th);
            if (name.en) firstNamesMaleEn.push(name.en);
        });
        data.lastname.forEach(name => {
            if (name.th) allLastNamesTh.push(name.th);
            if (name.en) allLastNamesEn.push(name.en);
        });
        data.nicknameFemale.forEach(name => {
            if (name.th) nicknamesFemaleTh.push(name.th);
            if (name.en) nicknamesFemaleEn.push(name.en);
        });
        data.nicknameMale.forEach(name => {
            if (name.th) nicknamesMaleTh.push(name.th);
            if (name.en) nicknamesMaleEn.push(name.en);
        });

        allFirstNamesTh = [...firstNamesFemaleTh, ...firstNamesMaleTh];
        allFirstNamesEn = [...firstNamesFemaleEn, ...firstNamesMaleEn];
        allNicknamesTh = [...nicknamesFemaleTh, ...nicknamesMaleTh];
        allNicknamesEn = [...nicknamesFemaleEn, ...nicknamesMaleEn];

        if (generateNameBtn) {
            showNotification('โหลดข้อมูลชื่อสำเร็จ!', 'success');
            generateNameBtn.disabled = false;
            generateNameBtn.innerHTML = originalBtnText;
        }
    } catch (error) {
        console.error("Failed to load name data:", error);
        if (generateNameBtn) {
            showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูลชื่อ!', 'error');
            generateNameBtn.innerHTML = '⚠️ โหลดข้อมูลล้มเหลว';
        }
    }
}

// Tab Management
function switchTab(tabName, event) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const fallbackTab = Array.from(document.querySelectorAll('.tab')).find(t => t.getAttribute('onclick').includes(tabName));
        if (fallbackTab) fallbackTab.classList.add('active');
    }
    document.getElementById(tabName).classList.add('active');
}

// --- Thai ID Functions ---
function createThaiId() {
    const firstDigit = Math.floor(Math.random() * 8) + 1;
    const remainingDigits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
    const idNumbers = [firstDigit, ...remainingDigits];
    let total = 0;
    for (let i = 0; i < 12; i++) {
        total += (13 - i) * idNumbers[i];
    }
    const checkDigit = (11 - (total % 11)) % 10;
    idNumbers.push(checkDigit);
    return idNumbers.join('');
}

async function generateThaiIds() {
    const countInput = document.getElementById('thaiIdCount');
    const count = parseInt(countInput.value);
    const generateBtn = document.getElementById('generateThaiIdBtn');
    if (!count || count <= 0 || count > 1000) {
        showNotification('กรุณาระบุจำนวนระหว่าง 1-1000', 'warning');
        return;
    }
    generateBtn.classList.add('loading');
    generateBtn.innerHTML = '⏳ กำลังสร้าง...';
    generateBtn.disabled = true;
    generatedThaiIds.clear();
    const resultArea = document.getElementById('thaiIdResultArea');
    resultArea.value = '';
    const allNewIds = [];
    let attempts = 0;
    const maxAttempts = count * 1000;
    for (let i = 0; i < count; i++) {
        let newId;
        do {
            newId = createThaiId();
            attempts++;
            if (attempts > maxAttempts && allNewIds.length < i + 1) {
                showNotification('ไม่สามารถสร้างเลขที่ไม่ซ้ำกันได้เพียงพอ ลองอีกครั้ง', 'warning');
                break;
            }
        } while (generatedThaiIds.has(newId) && attempts <= maxAttempts);
        if (!generatedThaiIds.has(newId)) {
            generatedThaiIds.add(newId);
            allNewIds.push(newId);
        }
        if ((i + 1) % 50 === 0 || (i + 1) === count) {
            updateThaiIdResultsDisplay(allNewIds);
            await new Promise(resolve => setTimeout(resolve, 1));
        }
        if (attempts > maxAttempts && allNewIds.length < count) break;
    }
    thaiIdResults = allNewIds;
    updateThaiIdResultsDisplay(thaiIdResults);
    if (thaiIdResults.length > 0) {
        await autoCopyResults(thaiIdResults.join('\n'), `สร้างและคัดลอกเลขไทยสำเร็จ ${thaiIdResults.length} เลข 📋`);
    } else if (count > 0) {
        showNotification('ไม่สามารถสร้างเลขได้', 'error');
    }
    generateBtn.classList.remove('loading');
    generateBtn.innerHTML = '🎲 สุ่มเลข';
    generateBtn.disabled = false;
}

function updateThaiIdResultsDisplay(idsToDisplay) {
    const resultArea = document.getElementById('thaiIdResultArea');
    const generatedCount = document.getElementById('thaiIdGeneratedCount');
    resultArea.value = idsToDisplay.map(id => formatThaiId(id)).join('\n');
    generatedCount.textContent = idsToDisplay.length.toLocaleString();
}

function formatThaiId(id) {
    if (!id || id.length !== 13) return id;
    return id.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
}

function copyThaiIdResults() {
    if (thaiIdResults.length === 0) {
        showNotification('ยังไม่มีเลขที่สุ่ม!', 'warning');
        return;
    }
    copyToClipboard(thaiIdResults.join('\n'), `คัดลอกเลขไทยสำเร็จ ${thaiIdResults.length} เลข`);
}

function clearThaiIdResults() {
    if (thaiIdResults.length === 0) {
        showNotification('ไม่มีข้อมูลให้ล้าง', 'warning');
        return;
    }
    if (confirm(`คุณต้องการล้างผลลัพธ์ ${thaiIdResults.length} เลข หรือไม่?`)) {
        generatedThaiIds.clear();
        thaiIdResults = [];
        document.getElementById('thaiIdResultArea').value = '';
        document.getElementById('thaiIdGeneratedCount').textContent = '0';
        showNotification('ล้างผลลัพธ์เลขไทยสำเร็จ', 'success');
    }
}

// --- GUID Functions ---
function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatGuid(guid) {
    const upperCase = document.getElementById('upperCase').checked;
    const withBraces = document.getElementById('withBraces').checked;
    const withoutHyphens = document.getElementById('withoutHyphens').checked;
    let result = guid;
    if (upperCase) result = result.toUpperCase();
    if (withoutHyphens) result = result.replace(/-/g, '');
    if (withBraces) result = `{${result}}`;
    return result;
}

async function generateGuids() {
    const countInput = document.getElementById('guidCount');
    const count = parseInt(countInput.value);
    const generateBtn = document.getElementById('generateGuidBtn');
    if (!count || count <= 0 || count > 1000) {
        showNotification('กรุณาระบุจำนวนระหว่าง 1-1000', 'warning');
        return;
    }
    generateBtn.classList.add('loading');
    generateBtn.innerHTML = '⏳ กำลังสร้าง...';
    generateBtn.disabled = true;
    const resultArea = document.getElementById('guidResultArea');
    resultArea.value = '';
    const newGuids = [];
    for (let i = 0; i < count; i++) {
        newGuids.push(generateGuid());
        if ((i + 1) % 50 === 0 || (i + 1) === count) {
            updateGuidResultsDisplay(newGuids);
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }
    guidResults = newGuids;
    updateGuidResultsDisplay(guidResults);
    if (guidResults.length > 0) {
        await autoCopyResults(guidResults.map(g => formatGuid(g)).join('\n'), `สร้างและคัดลอก GUID สำเร็จ ${guidResults.length} ตัว 📋`);
    }
    generateBtn.classList.remove('loading');
    generateBtn.innerHTML = '🎲 สุ่ม GUID';
    generateBtn.disabled = false;
}

function updateGuidResultsDisplay(guidsToDisplay) {
    const resultArea = document.getElementById('guidResultArea');
    const generatedCount = document.getElementById('guidGeneratedCount');
    resultArea.value = guidsToDisplay.map(guid => formatGuid(guid)).join('\n');
    generatedCount.textContent = guidsToDisplay.length.toLocaleString();
}

function copyGuidResults() {
    if (guidResults.length === 0) {
        showNotification('ยังไม่มี GUID ที่สุ่ม!', 'warning');
        return;
    }
    copyToClipboard(guidResults.map(guid => formatGuid(guid)).join('\n'), `คัดลอก GUID สำเร็จ ${guidResults.length} ตัว`);
}

function clearGuidResults() {
    if (guidResults.length === 0) {
        showNotification('ไม่มีข้อมูลให้ล้าง', 'warning');
        return;
    }
    if (confirm(`คุณต้องการล้างผลลัพธ์ ${guidResults.length} GUID หรือไม่?`)) {
        guidResults = [];
        document.getElementById('guidResultArea').value = '';
        document.getElementById('guidGeneratedCount').textContent = '0';
        showNotification('ล้างผลลัพธ์ GUID สำเร็จ', 'success');
    }
}

// --- Random Name Functions ---
function createRandomName() {
    const selectedGender = document.querySelector('input[name="gender"]:checked').value;
    const langTh = document.getElementById('nameLangTh').checked;
    const langEn = document.getElementById('nameLangEn').checked;
    const typeFirst = document.getElementById('nameTypeFirst').checked;
    const typeLast = document.getElementById('nameTypeLast').checked;
    const typeNickname = document.getElementById('nameTypeNickname').checked;

    if (allLastNamesTh.length === 0 && allFirstNamesTh.length === 0 && allNicknamesTh.length === 0) { // Basic check if data isn't loaded
        return "ข้อมูลชื่อยังไม่พร้อมใช้งาน";
    }

    let thNameParts = [];
    let enNameParts = [];

    // Helper function to get corresponding names from data arrays
    function getCorrespondingName(thArray, enArray, selectedIndex) {
        if (selectedIndex >= 0 && selectedIndex < thArray.length && selectedIndex < enArray.length) {
            return {
                th: thArray[selectedIndex],
                en: enArray[selectedIndex]
            };
        }
        return { th: "", en: "" };
    }

    // Select indices for each name part
    let firstNameIndex = -1, lastNameIndex = -1, nicknameIndex = -1;

    // Get appropriate arrays based on gender
    let currentFirstNamesTh, currentFirstNamesEn, currentNicknamesTh, currentNicknamesEn;
    if (selectedGender === 'female') {
        currentFirstNamesTh = firstNamesFemaleTh;
        currentFirstNamesEn = firstNamesFemaleEn;
        currentNicknamesTh = nicknamesFemaleTh;
        currentNicknamesEn = nicknamesFemaleEn;
    } else if (selectedGender === 'male') {
        currentFirstNamesTh = firstNamesMaleTh;
        currentFirstNamesEn = firstNamesMaleEn;
        currentNicknamesTh = nicknamesMaleTh;
        currentNicknamesEn = nicknamesMaleEn;
    } else { // 'any'
        currentFirstNamesTh = allFirstNamesTh;
        currentFirstNamesEn = allFirstNamesEn;
        currentNicknamesTh = allNicknamesTh;
        currentNicknamesEn = allNicknamesEn;
    }

    // Generate random indices for each name type
    if (typeFirst && currentFirstNamesTh && currentFirstNamesTh.length > 0) {
        firstNameIndex = Math.floor(Math.random() * Math.min(currentFirstNamesTh.length, currentFirstNamesEn.length));
    }
    if (typeLast && allLastNamesTh && allLastNamesTh.length > 0) {
        lastNameIndex = Math.floor(Math.random() * Math.min(allLastNamesTh.length, allLastNamesEn.length));
    }
    if (typeNickname && currentNicknamesTh && currentNicknamesTh.length > 0) {
        nicknameIndex = Math.floor(Math.random() * Math.min(currentNicknamesTh.length, currentNicknamesEn.length));
    }

    // Build name parts
    let thFirstNamePart = "", enFirstNamePart = "";
    let thLastNamePart = "", enLastNamePart = "";
    let thNicknamePart = "", enNicknamePart = "";

    if (firstNameIndex >= 0) {
        const firstName = getCorrespondingName(currentFirstNamesTh, currentFirstNamesEn, firstNameIndex);
        thFirstNamePart = firstName.th;
        enFirstNamePart = firstName.en;
    }

    if (lastNameIndex >= 0) {
        const lastName = getCorrespondingName(allLastNamesTh, allLastNamesEn, lastNameIndex);
        thLastNamePart = lastName.th;
        enLastNamePart = lastName.en;
    }

    if (nicknameIndex >= 0) {
        const nickname = getCorrespondingName(currentNicknamesTh, currentNicknamesEn, nicknameIndex);
        thNicknamePart = nickname.th;
        enNicknamePart = nickname.en;
    }

    // Construct final names
    if (langTh) {
        let combinedTh = [thFirstNamePart, thLastNamePart].filter(Boolean).join(' ');
        if (thNicknamePart) {
            combinedTh = combinedTh ? `${combinedTh} (${thNicknamePart})` : `(${thNicknamePart})`;
        }
        if (combinedTh) thNameParts.push(combinedTh);
    }

    if (langEn) {
        let combinedEn = [enFirstNamePart, enLastNamePart].filter(Boolean).join(' ');
        if (enNicknamePart) {
            combinedEn = combinedEn ? `${combinedEn} (${enNicknamePart})` : `(${enNicknamePart})`;
        }
        if (combinedEn) enNameParts.push(combinedEn);
    }

    if (thNameParts.length === 0 && enNameParts.length === 0) return "";

    // If both languages are selected, show them on the same line separated by " | "
    if (langTh && langEn && thNameParts.length > 0 && enNameParts.length > 0) {
        return `${thNameParts[0]} | ${enNameParts[0]}`;
    }

    return thNameParts.concat(enNameParts).join(', ');
}

async function generateNames() {
    const countInput = document.getElementById('nameCount');
    const count = parseInt(countInput.value);
    const generateBtn = document.getElementById('generateNameBtn');

    const langTh = document.getElementById('nameLangTh').checked;
    const langEn = document.getElementById('nameLangEn').checked;
    const typeFirst = document.getElementById('nameTypeFirst').checked;
    const typeLast = document.getElementById('nameTypeLast').checked;
    const typeNickname = document.getElementById('nameTypeNickname').checked;


    if (!(langTh || langEn) || !(typeFirst || typeLast || typeNickname)) {
        showNotification('กรุณาเลือกภาษาและประเภทของชื่ออย่างน้อยหนึ่งอย่าง', 'warning');
        nameResults = [];
        updateNameResultsDisplay(nameResults);
        return;
    }

    if (allLastNamesTh.length === 0 && allFirstNamesTh.length === 0 && allNicknamesTh.length === 0 && (typeFirst || typeLast || typeNickname)) {
        showNotification('ข้อมูลชื่อกำลังโหลดหรือโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'warning');
        return;
    }


    if (!count || count <= 0 || count > 1000) {
        showNotification('กรุณาระบุจำนวนระหว่าง 1-1000', 'warning');
        return;
    }

    generateBtn.classList.add('loading');
    generateBtn.innerHTML = '⏳ กำลังสร้าง...';
    generateBtn.disabled = true;

    const resultArea = document.getElementById('nameResultArea');
    resultArea.value = '';

    const newNames = [];
    for (let i = 0; i < count; i++) {
        const nameEntry = createRandomName();
        if (nameEntry) {
            newNames.push(nameEntry);
        }
        if ((i + 1) % 20 === 0 || (i + 1) === count) {
            updateNameResultsDisplay(newNames);
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }
    nameResults = newNames.filter(name => name.trim() !== ""); // Filter out empty strings again just in case
    updateNameResultsDisplay(nameResults);
    if (nameResults.length > 0) {
        await autoCopyResults(nameResults.join('\n'), `สร้างและคัดลอกชื่อสำเร็จ ${nameResults.length} ชื่อ 📋`);
    }

    generateBtn.classList.remove('loading');
    generateBtn.innerHTML = '👤 สุ่มชื่อ';
    generateBtn.disabled = false;
}

function updateNameResultsDisplay(namesToDisplay) {
    const resultArea = document.getElementById('nameResultArea');
    const generatedCount = document.getElementById('nameGeneratedCount');
    resultArea.value = namesToDisplay.join('\n');
    generatedCount.textContent = namesToDisplay.length.toLocaleString();
}

function copyNameResults() {
    if (nameResults.length === 0) {
        showNotification('ยังไม่มีชื่อที่สุ่ม!', 'warning');
        return;
    }
    copyToClipboard(nameResults.join('\n'), `คัดลอกชื่อสำเร็จ ${nameResults.length} ชื่อ`);
}

function clearNameResults() {
    if (nameResults.length === 0) {
        showNotification('ไม่มีข้อมูลให้ล้าง', 'warning');
        return;
    }
    if (confirm(`คุณต้องการล้างผลลัพธ์ ${nameResults.length} ชื่อ หรือไม่?`)) {
        nameResults = [];
        document.getElementById('nameResultArea').value = '';
        document.getElementById('nameGeneratedCount').textContent = '0';
        showNotification('ล้างผลลัพธ์ชื่อสำเร็จ', 'success');
    }
}

// --- Random Custom Number Functions ---
function createCustomRandomNumber(length) {
    let number = '';
    const digits = '0123456789';
    for (let i = 0; i < length; i++) {
        number += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return number;
}

async function generateCustomNumbers() {
    const countInput = document.getElementById('customNumberCount');
    const lengthInput = document.getElementById('customNumberLength');
    const count = parseInt(countInput.value);
    const length = parseInt(lengthInput.value);
    const generateBtn = document.getElementById('generateCustomNumberBtn');

    if (!count || count <= 0 || count > 1000) {
        showNotification('กรุณาระบุจำนวนระหว่าง 1-1000', 'warning');
        return;
    }
    if (!length || length <= 0 || length > 50) {
        showNotification('กรุณาระบุความยาวระหว่าง 1-50', 'warning');
        return;
    }
    generateBtn.classList.add('loading');
    generateBtn.innerHTML = '⏳ กำลังสร้าง...';
    generateBtn.disabled = true;
    const resultArea = document.getElementById('customNumberResultArea');
    resultArea.value = '';
    const newNumbers = [];
    for (let i = 0; i < count; i++) {
        newNumbers.push(createCustomRandomNumber(length));
        if ((i + 1) % 50 === 0 || (i + 1) === count) {
            updateCustomNumberResultsDisplay(newNumbers);
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }
    customNumberResults = newNumbers;
    updateCustomNumberResultsDisplay(customNumberResults);
    if (customNumberResults.length > 0) {
        await autoCopyResults(customNumberResults.join('\n'), `สร้างและคัดลอกเลขสำเร็จ ${customNumberResults.length} ตัว 📋`);
    }
    generateBtn.classList.remove('loading');
    generateBtn.innerHTML = '🔢 สุ่มเลข';
    generateBtn.disabled = false;
}

function updateCustomNumberResultsDisplay(numbersToDisplay) {
    const resultArea = document.getElementById('customNumberResultArea');
    const generatedCount = document.getElementById('customNumberGeneratedCount');
    resultArea.value = numbersToDisplay.join('\n');
    generatedCount.textContent = numbersToDisplay.length.toLocaleString();
}

function copyCustomNumberResults() {
    if (customNumberResults.length === 0) {
        showNotification('ยังไม่มีเลขที่สุ่ม!', 'warning');
        return;
    }
    copyToClipboard(customNumberResults.join('\n'), `คัดลอกเลขสำเร็จ ${customNumberResults.length} ตัว`);
}

function clearCustomNumberResults() {
    if (customNumberResults.length === 0) {
        showNotification('ไม่มีข้อมูลให้ล้าง', 'warning');
        return;
    }
    if (confirm(`คุณต้องการล้างผลลัพธ์ ${customNumberResults.length} เลข หรือไม่?`)) {
        customNumberResults = [];
        document.getElementById('customNumberResultArea').value = '';
        document.getElementById('customNumberGeneratedCount').textContent = '0';
        showNotification('ล้างผลลัพธ์เลขสำเร็จ', 'success');
    }
}

// --- Shared Functions ---
async function autoCopyResults(textToCopy, successMessage) {
    if (!textToCopy) return;
    try {
        await navigator.clipboard.writeText(textToCopy);
        showNotification(successMessage, 'success');
    } catch (error) {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            document.execCommand('copy');
            showNotification(successMessage, 'success');
        } catch (err) {
            showNotification('คัดลอกอัตโนมัติไม่สำเร็จ โปรดคัดลอกด้วยตนเอง', 'warning');
        }
        document.body.removeChild(tempTextArea);
    }
}

function copyToClipboard(textToCopy, successMessage) {
    if (!textToCopy) {
        showNotification('ไม่มีข้อมูลให้คัดลอก', 'warning');
        return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification(successMessage, 'success');
    }).catch(() => {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        showNotification(successMessage, 'success');
    });
}

function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 300);
    }, 4000);
}

// --- Event Listeners ---
function setupInputValidation(inputId) {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.addEventListener('input', function(e) {
            if (parseInt(e.target.value) < 0) e.target.value = Math.abs(parseInt(e.target.value));
            const maxVal = parseInt(e.target.max);
            if (maxVal && parseInt(e.target.value) > maxVal) e.target.value = maxVal;
        });
    }
}

['thaiIdCount', 'guidCount', 'nameCount', 'customNumberCount', 'customNumberLength'].forEach(setupInputValidation);

document.getElementById('thaiIdCount').addEventListener('keypress', function(e) { if (e.key === 'Enter') generateThaiIds(); });
document.getElementById('guidCount').addEventListener('keypress', function(e) { if (e.key === 'Enter') generateGuids(); });
document.getElementById('nameCount').addEventListener('keypress', function(e) { if (e.key === 'Enter') generateNames(); });
document.getElementById('customNumberCount').addEventListener('keypress', function(e) { if (e.key === 'Enter') generateCustomNumbers(); });
document.getElementById('customNumberLength').addEventListener('keypress', function(e) { if (e.key === 'Enter') generateCustomNumbers(); });

['upperCase', 'withBraces', 'withoutHyphens'].forEach(id => {
    document.getElementById(id).addEventListener('change', function() {
        if (guidResults.length > 0) updateGuidResultsDisplay(guidResults);
    });
});

document.addEventListener('DOMContentLoaded', loadNameData);

function navigateTo(url) {
    window.location.href = url;
}

// ตรวจสอบหน้าไหนที่กำลังเปิดอยู่
window.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop(); // เช่น "index.html"
    switch (currentPage) {
        case 'index.html':
        case '': // สำหรับหน้า root
            document.getElementById('btn-index').classList.add('active');
            break;
        case 'json.html':
            document.getElementById('btn-json').classList.add('active');
            break;
        case 'json_formatter.html':
            document.getElementById('btn-formatter').classList.add('active');
            break;
    }
});

let jsonData = [];

function showMessage(message, type = 'error') {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 5000);
}

function isShortJson(jsonArray) {
    return jsonArray.every(obj =>
        Object.keys(obj).length === 2 &&
        'orderNo' in obj &&
        'orderRefId' in obj
    );
}

function convertJSONToTable() {
    const input = document.getElementById('jsonInput').value.trim();
    if (!input) {
        showNotification('กรุณาใส่ข้อมูล JSON', 'error');
        return;
    }

    let jsonObjects = [];
    let parseError = false;

    try {
        // 1. พยายาม parse เป็น array ธรรมดา
        const arr = JSON.parse(input);
        if (Array.isArray(arr)) {
            jsonObjects = arr;
        } else if (typeof arr === 'object') {
            jsonObjects = [arr];
        }
    } catch (e) {
    const matches = input.match(/"({[\s\S]*?})"/g);
    if (matches && matches.length > 0) {
        for (let m of matches) {
            try {
                let block = m.slice(1, -1).replace(/""/g, '"');
                const obj = JSON.parse(block);
                jsonObjects.push(obj);
            } catch (err) {
                parseError = true;
                break;
            }
        }
    } else {
        parseError = true;
    }
}

    if (jsonObjects.length === 0 || parseError) {
        showNotification('รูปแบบ JSON ไม่ถูกต้อง หรือไม่รองรับ', 'error');
        document.getElementById('resultTable').style.display = 'none';
        return;
    }

    // ✅ แสดงตารางตามชนิดข้อมูล
    if (isShortJson(jsonObjects)) {
        renderShortTable(jsonObjects);
    } else {
        renderTable(jsonObjects, 'resultTableContent');
    }

    document.getElementById('resultTable').style.display = 'block';
    showNotification('แปลง JSON สำเร็จ!', 'success');
}


function renderTable(data, elementId) {
    const headers = [
        'Mobile No',
        'ID Card',
        'Customer Account',
        'Service Account',
        'Billing Account',
        'Order No',
        'FS',
        'PrivateIdValue'
    ];

    let tableHTML = '<table><thead><tr>';
    headers.forEach((header, colIdx) => {
        tableHTML += `<th style="text-align:center;vertical-align:middle;white-space:nowrap;">
            <span style="cursor:pointer" onclick="copyColumn(${colIdx})" title="คลิกเพื่อคัดลอกแนวตั้ง">${header}</span>
            <button
                style="
                    font-size:14px;
                    padding:2px 3px;
                    height:26px;
                    margin-left:1px;
                    vertical-align:middle;
                    border-radius:8px;
                    border:1px solid #d1d5db;
                    background:#f3f4f6;
                    cursor:pointer;
                    transition:background 0.2s;
                "
                onmouseover="this.style.background='#e0e7ef'"
                onmouseout="this.style.background='#f3f4f6'"
                onclick="event.stopPropagation();copyColumnWithQuotes(${colIdx})"
                title="คัดลอกแบบมี quote"
            >✂️</button>
        </th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    data.forEach(row => {
        tableHTML += '<tr>';
        tableHTML += `<td>${row['nonMobileNo'] || ''}</td>`;
        tableHTML += `<td>${row['publicIdValue'] || ''}</td>`;
        tableHTML += `<td>${row['caNumber'] || ''}</td>`;
        tableHTML += `<td>${row['saNumber'] || ''}</td>`;
        tableHTML += `<td>${row['baNumber'] || ''}</td>`;
        tableHTML += `<td>${row['orderRefId'] || ''}</td>`;
        tableHTML += `<td>${row['orderNo'] || ''}</td>`;
        tableHTML += `<td>${row['privateIdValue'] || ''}</td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    document.getElementById(elementId).innerHTML = tableHTML;

    window._verticalTableData = data.map(row => [
        row['nonMobileNo'] || '',
        row['publicIdValue'] || '',
        row['caNumber'] || '',
        row['saNumber'] || '',
        row['baNumber'] || '',
        row['orderRefId'] || '',
        row['orderNo'] || '',
        row['privateIdValue'] || ''
    ]);
}

// ฟังก์ชันคัดลอกแนวตั้งแบบ quote
function copyColumnWithQuotes(colIdx) {
    if (!window._verticalTableData) return;
    const colData = window._verticalTableData.map(row => `'${row[colIdx]}'`);
    const text = colData.join(', ');
    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification('คัดลอกแบบ quote แล้ว');
    });
}

// ฟังก์ชันคัดลอกแนวตั้งปกติ
function copyColumn(colIdx) {
    if (!window._verticalTableData) return;
    const colData = window._verticalTableData.map(row => row[colIdx]);
    const text = colData.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification('คัดลอกแนวตั้งแล้ว');
    });
}

function copyTableData(tableId, format = 'csv') {
    const tableElement = document.querySelector(`#${tableId} table`);
    if (!tableElement) {
        showMessage('ไม่พบตารางที่จะคัดลอก');
        return;
    }

    let content = '';
    const rows = tableElement.querySelectorAll('tr');
    const separator = format === 'csv' ? ',' : '\t';

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('th, td');
        const rowData = [];

        cells.forEach(cell => {
            let cellText = '';

            if (cell.tagName === 'TH') {
                // สำหรับ header: เอาเฉพาะข้อความแรก (ไม่รวมไอคอนหรือปุ่ม)
                const span = cell.querySelector('span');
                cellText = span ? span.textContent.trim() : cell.textContent.trim();
            } else {
                cellText = cell.textContent.trim();
            }

            if (format === 'csv') {
                if (cellText.includes(',') || cellText.includes('\n') || cellText.includes('"')) {
                    cellText = '"' + cellText.replace(/"/g, '""') + '"';
                }
            } else {
                cellText = cellText.replace(/\t/g, ' ');
            }

            rowData.push(cellText);
        });

        content += rowData.join(separator) + '\n';
    });

    // คัดลอกลง clipboard
    navigator.clipboard.writeText(content).then(() => {
        showCopyNotification(format.toUpperCase());
    }).catch(err => {
        // Fallback สำหรับเบราว์เซอร์เก่า
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyNotification(format.toUpperCase());
    });
}

function showCopyNotification(format = '') {
    showNotification(`คัดลอกข้อมูล${format ? ' ' + format : ''} สำเร็จ! 📋`, 'success');
}

function generateSecondTable() {
    if (!jsonData || jsonData.length === 0) {
        showMessage('กรุณาแปลง JSON ก่อนสร้างตาราง 2nd');
        return;
    }

    const headers = ['Data_MobileNo', 'Data_Order', 'Data_Air'];

    let tableHTML = '<table><thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    jsonData.forEach(row => {
        tableHTML += '<tr>';
        tableHTML += `<td>${row['nonMobileNo'] || ''}</td>`;
        tableHTML += `<td>${row['orderRefId'] || ''}</td>`;
        tableHTML += `<td>${row['privateIdValue'] || ''}</td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';

    document.getElementById('secondTableContent').innerHTML = tableHTML;
    document.getElementById('secondTable').style.display = 'block';

    showMessage(`สร้างตาราง 2nd สำเร็จ! พบข้อมูล ${jsonData.length} รายการ`, 'success');
}

function parseTextToJSON(text) {
    const records = text.split(/\n\s*\n/);
    const jsonArray = [];

    records.forEach(record => {
        const lines = record.split("\n").map(line => line.trim()).filter(line => line);
        const jsonObject = {};
        const attributeList = [];

        lines.forEach(line => {
            if (line.startsWith("#### AttributeList")) {
                return;
            }

            if (line.startsWith("---")) {
                const attrParts = line.replace("---", "").split(" : ");
                if (attrParts.length === 2) {
                    const key = attrParts[0].trim();
                    const value = attrParts[1].trim();
                    attributeList.push({ [key]: value });
                }
            } else {
                const parts = line.split(" : ");
                if (parts.length === 2) {
                    const key = parts[0].trim();
                    const value = parts[1].trim();
                    jsonObject[key] = value !== "null" ? value : "";
                }
            }
        });

        const attributeNonMobileNos = attributeList
            .filter(attr => attr.hasOwnProperty("nonMobileNo"))
            .map(attr => attr["nonMobileNo"])
            .join(", ");

        jsonObject["Attribute_NonMobileNo"] = attributeNonMobileNos;

        if (Object.keys(jsonObject).length > 0) {
            jsonArray.push(jsonObject);
        }
    });

    return jsonArray;
}

function convertTextToTable() {
    const textData = document.getElementById('jsonInput').value.trim();

    if (!textData) {
        showMessage('กรุณาใส่ข้อมูล Text');
        return;
    }

    try {
        const parsedData = parseTextToJSON(textData);

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            showMessage('ไม่พบข้อมูลที่ถูกต้องในข้อความที่ใส่');
            return;
        }

        const headers = [
            'Mobile No',
            'ID Card',
            'Customer Account',
            'Service Account',
            'Billing Account',
            'Order No',
            'Reference No'
        ];

        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        parsedData.forEach(row => {
            const mobile = row['nonMobileNo'] || row['Attribute_NonMobileNo'] || '';
            const refNo = row['referanceNo'] || '';
            const idCard = refNo.startsWith('FBB-') ? 'D' + refNo.replace('FBB-', '').replace(/-/g, '') : '';

            tableHTML += '<tr>';
            tableHTML += `<td>${mobile}</td>`;
            tableHTML += `<td>${idCard}</td>`;
            tableHTML += `<td>${row['caNumber'] || ''}</td>`;
            tableHTML += `<td>${row['saNumber'] || ''}</td>`;
            tableHTML += `<td>${row['baNumber'] || ''}</td>`;
            tableHTML += `<td>${row['OrderNo'] || ''}</td>`;
            tableHTML += `<td>${refNo}</td>`;
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';

        document.getElementById('resultTableContent').innerHTML = tableHTML;
        document.getElementById('resultTable').style.display = 'block';

        showMessage(`แปลงข้อมุล Text สำเร็จ! พบข้อมูล ${parsedData.length} รายการ`, 'success');

        // เก็บข้อมูลสำหรับใช้กับตาราง 2nd
        jsonData = parsedData;

    } catch (e) {
        showMessage(`เกิดข้อผิดพลาดในการแปลงข้อมูล: ${e.message}`);
    }
}

function clearTableAll() {
    document.getElementById('jsonInput').value = '';
    document.getElementById('resultTable').style.display = 'none';
    document.getElementById('secondTable').style.display = 'none';
    document.getElementById('messageArea').innerHTML = '';
    jsonData = [];
    showNotification('ล้างข้อมูลเรียบร้อยแล้ว', 'success');
}

// Example data for testing
function loadExampleJSON() {
    const exampleData = `[
  {
    "nonMobileNo": "0812345678",
    "publicIdValue": "1234567890123",
    "caNumber": "CA001",
    "saNumber": "SA001",
    "baNumber": "BA001",
    "orderRefId": "ORD001",
    "orderNo": "FS001",
    "privateIdValue": "PID001"
  }
]`;
    document.getElementById('jsonInput').value = exampleData;
}

function loadExampleText() {
    const exampleText = `nonMobileNo : 0812345678
publicIdValue : 1234567890123
caNumber : CA001
saNumber : SA001
baNumber : BA001
referanceNo : FBB-123-456
OrderNo : ORD001

#### AttributeList
--- nonMobileNo : 0812345678

nonMobileNo : 0898765432
publicIdValue : 9876543210987
caNumber : CA002
saNumber : SA002
baNumber : BA002
referanceNo : FBB-789-012
OrderNo : ORD002

#### AttributeList
--- nonMobileNo : 0898765432`;
    document.getElementById('jsonInput').value = exampleText;
}


window.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop(); // เช่น "index.html"
    switch (currentPage) {
        case 'index.html':
        case '': // สำหรับหน้า root
            document.getElementById('btn-index').classList.add('active');
            break;
        case 'json.html':
            document.getElementById('btn-json').classList.add('active');
            break;
        case 'json_formatter.html':
            document.getElementById('btn-formatter').classList.add('active');
            break;
    }
});

let jsonHistory = [];

function processJSON() {
    const jsonInput = document.getElementById('jsonInputFormatter');
    const historyDiv = document.getElementById('history');
    const jsonString = jsonInput.value.trim();

    if (!jsonString) {
        showNotification('⚠️ กรุณาวางหรือพิมพ์ข้อมูล JSON', 'warning');
        return;
    }

    try {
        const jsonObject = JSON.parse(jsonString);
        // Pretty Print
        const formattedJson = JSON.stringify(jsonObject, null, 2);
        
        // Validation Result
        const validationResult = { valid: true };

        // Save to history
        formatterHistory.unshift({ 
            original: jsonString,
            formatted: formattedJson,
            data: jsonObject,
            validation: validationResult
        });

        // จำกัดประวัติการใช้งาน
        if (formatterHistory.length > 5) {
            formatterHistory.pop();
        }

        // Render history
        renderHistory();

        showNotification('✅ ประมวลผล JSON สำเร็จ', 'success');

    } catch (error) {
        showNotification(`❌ JSON ไม่ถูกต้อง: ${error.message}`, 'error');
        // Render invalid input to history if user desires. For now, only show notification.
        // Or you can validateJSON() first and process only if valid.
        validateJSON();
    }
}

function validateJSON() {
    const jsonInput = document.getElementById('jsonInputFormatter');
    const jsonString = jsonInput.value.trim();
    const historyDiv = document.getElementById('history');

    if (!jsonString) {
        showNotification('⚠️ กรุณาวางหรือพิมพ์ข้อมูล JSON เพื่อตรวจสอบ', 'warning');
        return;
    }

    try {
        const jsonObject = JSON.parse(jsonString);
        const formattedJson = JSON.stringify(jsonObject, null, 2);
        
        const validationResult = { 
            valid: true,
            message: 'JSON ถูกต้องตามรูปแบบ'
        };

        // Save to history only for valid JSON
        formatterHistory.unshift({ 
            original: jsonString,
            formatted: formattedJson,
            data: jsonObject,
            validation: validationResult
        });
        
        if (formatterHistory.length > 5) {
            formatterHistory.pop();
        }

        renderHistory();
        showNotification('✅ JSON ถูกต้องตามรูปแบบ', 'success');

    } catch (error) {
        const validationResult = { 
            valid: false,
            message: `ข้อผิดพลาด: ${error.message}`
        };

        // Save to history for invalid JSON too, showing the error
        formatterHistory.unshift({ 
            original: jsonString,
            formatted: jsonString, // Use original for invalid
            data: null,
            validation: validationResult
        });
        
        if (formatterHistory.length > 5) {
            formatterHistory.pop();
        }

        renderHistory();
        showNotification(`❌ JSON ไม่ถูกต้อง: ${error.message}`, 'error');
    }
}

function clearFormatterAll() {
    document.getElementById('jsonInputFormatter').value = '';
    document.getElementById('history').innerHTML = '';
    formatterHistory = [];
    showNotification('🗑️ ล้างข้อมูล JSON Formatter ทั้งหมดแล้ว', 'info');
}

function clearFormatterAll() {
  document.getElementById('jsonInputFormatter').value = '';
  jsonHistory = [];
  renderHistory();
  showNotification('ล้างข้อมูลทั้งหมดแล้ว!!', 'error');
}

function generateTree(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return `<span style="color: #059669; font-weight: 600;">${JSON.stringify(obj)}</span>`;
  }
  
  const isArray = Array.isArray(obj);
  const entries = isArray
    ? obj.map((v, i) => `<li><details open><summary>[${i}]</summary>${generateTree(v)}</details></li>`)
    : Object.entries(obj).map(
        ([k, v]) => `<li><details open><summary>"${k}"</summary>${generateTree(v)}</details></li>`
      );
  
  return `<ul>${entries.join('')}</ul>`;
}

function renderHistory() {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = ''; // Clear previous history

    formatterHistory.forEach((item, index) => {
        const html = generateResultHtml(index, item.formatted, item.validation, item.data);
        historyDiv.innerHTML += html;
    });

    // Add event listeners for new collapse icons
    document.querySelectorAll('.collapse-icon').forEach(icon => {
        icon.onclick = function() {
            toggleNode(this);
        };
    });
}

function generateResultHtml(index, formattedJson, validationResult, jsonObject, toolName = 'JSON Formatter') {
    const originalJson = formatterHistory[index].original;
    const item = formatterHistory[index];
    const validationClass = validationResult.valid ? 'success' : 'error';
    const validationIcon = validationResult.valid ? '✅' : '❌';
    const validationMessage = validationResult.valid ? 'JSON ถูกต้อง' : validationResult.message;
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    let resultOutputHtml = '';
    if (validationResult.valid) {
        // Pretty Print View
        resultOutputHtml += `
            <div class="result-output pretty-print-view active-view" data-view="pretty-print" id="content_${index}_pretty">
                <pre class="formatted-json-output"><code>${formattedJson}</code></pre>
            </div>
            `;
        
        // Tree View (If data is available)
        if (jsonObject) {
            const treeViewHtml = createChildNodeHtml(jsonObject, null, true); // Root starts expanded
            resultOutputHtml += `
                <div class="result-output json-tree-container" data-view="tree-view" id="content_${index}_tree" style="display: none;">
                    <div class="json-node-root">
                        ${treeViewHtml}
                    </div>
                </div>
                `;
        }
    } else {
         resultOutputHtml += `
            <div class="result-output pretty-print-view active-view error-output" data-view="pretty-print" id="content_${index}_pretty">
                <pre class="formatted-json-output">${originalJson}</pre>
                <div class="error-message">
                    ${validationMessage}
                </div>
            </div>
            `;
    }

    const html = `
        <div class="history-item ${validationClass}" id="item_${index}">
            <div class="history-header">
                <span class="history-title">${validationIcon} ผลลัพธ์ ${index + 1} (${toolName})</span>
                <span class="history-time">${time}</span>
            </div>
            
            <div class="history-controls">
                ${validationResult.valid ? `
                    <button class="btn btn-sm btn-primary" onclick="switchView(${index}, 'pretty')">{} Pretty Print</button>
                    <button class="btn btn-sm btn-primary" onclick="switchView(${index}, 'tree')">🌳 Tree View</button>
                    <button class="btn btn-sm btn-primary" onclick="showFullScreen(${index})">⛶ เต็มจอ</button>
                    <button class="btn btn-sm btn-info" onclick="copyToClipboard(document.getElementById('content_${index}_pretty').querySelector('code').textContent)">📋 คัดลอก JSON</button>
                    <button class="btn btn-sm btn-success" onclick="downloadJSON(${index}, '${toolName}')">💾 ดาวน์โหลด</button>
                ` : `
                    <button class="btn btn-sm btn-info" onclick="copyToClipboard(document.getElementById('jsonInputFormatter').value)">📋 คัดลอก Input</button>
                `}
                <button class="btn btn-sm btn-danger" onclick="clearHistoryItem(${index})">🗑️ ลบ</button>
            </div>
            
            <div class="history-content" id="content_${index}" data-validation="${validationResult.valid}">
                ${resultOutputHtml}
            </div>
        </div>
    `;

    return html;
}

function createChildNodeHtml(data, key = null, startExpanded = true) {
    let content = '';
    const isContainer = (typeof data === 'object' && data !== null);
    const isArray = Array.isArray(data);
    const displayKey = key !== null ? `<span class="json-key">${isArray ? '' : `"${key}"`}</span>: ` : '';

    if (isContainer) {
        const keys = Object.keys(data);
        const count = keys.length;
        const type = isArray ? `[${count}]` : `{${count}}`;
        const collapseIcon = startExpanded ? '▼' : '▶';
        const childrenStyle = startExpanded ? 'display: block;' : 'display: none;';
        const nodeClass = startExpanded ? 'expanded' : 'collapsed';

        content += `<div class="json-node ${isArray ? 'json-array' : 'json-object'} ${nodeClass}">`;
        
        // Header (Key + Type/Count + Toggle Icon)
        content += `<div class="json-header">`;
        content += `<span class="collapse-icon" onclick="toggleNode(this)">${collapseIcon}</span>`;
        content += `${displayKey}<span class="json-type">${type}</span><span class="json-count">${isArray ? 'items' : 'keys'}</span>`;
        content += `</div>`;
        
        // Children
        content += `<div class="json-children" style="${childrenStyle}">`;
        
        keys.forEach(childKey => {
            const childValue = data[childKey];
            content += createChildNodeHtml(childValue, childKey, false); // Children start collapsed
        });
        
        content += '</div>'; // close json-children
        content += '</div>'; // close json-node
        
    } else {
        // Primitive value (string, number, boolean, null)
        let value = data === null ? 'null' : (typeof data === 'string' ? `"${data}"` : data);
        let valueClass = typeof data === 'string' ? 'json-string' : 
                         (typeof data === 'number' ? 'json-number' : 
                         (typeof data === 'boolean' ? 'json-boolean' : 'json-null'));

        content += `<div class="json-node-primitive">${displayKey}<span class="${valueClass}">${value}</span></div>`;
    }

    return content;
}

function switchView(index, viewType) {
    const contentDiv = document.getElementById(`content_${index}`);
    const prettyView = document.getElementById(`content_${index}_pretty`);
    const treeView = document.getElementById(`content_${index}_tree`);
    
    // Remove active state from all
    contentDiv.querySelectorAll('.result-output').forEach(el => el.classList.remove('active-view'));
    contentDiv.querySelectorAll('.result-output').forEach(el => el.style.display = 'none');

    if (viewType === 'pretty' && prettyView) {
        prettyView.style.display = 'block';
        prettyView.classList.add('active-view');
    } else if (viewType === 'tree' && treeView) {
        treeView.style.display = 'block';
        treeView.classList.add('active-view');
    }
}

function toggleNode(iconElement) {
    const header = iconElement.parentNode;
    const node = header.parentNode;
    const children = node.querySelector('.json-children');

    if (!children) return; // Not a container node
    
    // Toggle display of children
    if (children.style.display === 'none') {
        children.style.display = 'block';
        iconElement.textContent = '▼'; // Change to expand icon
        node.classList.remove('collapsed');
        node.classList.add('expanded');
    } else {
        children.style.display = 'none';
        iconElement.textContent = '▶'; // Change to collapse icon
        node.classList.remove('expanded');
        node.classList.add('collapsed');
    }
}

/**
 * ลบรายการประวัติการใช้งาน JSON Formatter
 */
function clearHistoryItem(index) {
    formatterHistory.splice(index, 1);
    renderHistory();
    showNotification('🗑️ ลบรายการประวัติแล้ว', 'info');
}

/**
 * ฟังก์ชันดาวน์โหลด JSON จาก History Item
 */
function downloadJSON(idx, toolName = 'json formatter') {
  const contentDiv = document.getElementById(`content_${idx}`);
  const activeView = contentDiv.querySelector('.active-view');

  if (!activeView) {
    showNotification('⚠️ ไม่พบข้อมูลที่เลือก', 'warning');
    return;
  }
  
  // ให้ดาวน์โหลดจาก Pretty Print เสมอ เพื่อให้ได้ JSON ที่ถูกต้อง
  const prettyPrintView = contentDiv.querySelector('.pretty-print-view');
  let content = '';

  if (prettyPrintView) {
      content = prettyPrintView.querySelector('code') ? prettyPrintView.querySelector('code').textContent : prettyPrintView.textContent;
  } else {
      // Fallback: Use the original input if no pretty print is found (shouldn't happen for valid JSON)
      content = formatterHistory[idx].original;
  }


  if (!content.trim() || formatterHistory[idx].validation.valid === false) {
      showNotification('⚠️ ไม่สามารถดาวน์โหลด JSON ที่ไม่ถูกต้องได้', 'error');
      return;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${toolName.toLowerCase().replace(' ', '_')}_${idx + 1}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('📁 ไฟล์ดาวน์โหลดสำเร็จ!', 'success');
}

/**
 * เปิด Modal แสดงผล JSON เต็มหน้าจอ
 */
function showFullScreen(index) {
    const historyContentDiv = document.getElementById(`content_${index}`);
    const modal = document.getElementById('fullScreenModal');
    const modalContent = document.getElementById('modalContent');
    const modalTitle = document.getElementById('modalTitle');
    
    // 1. ตรวจสอบว่ากำลังแสดงผลแบบไหนอยู่
    const activeView = historyContentDiv.querySelector('.active-view');
    const viewType = activeView ? activeView.getAttribute('data-view') : 'pretty-print';

    // 2. คัดลอกเนื้อหาที่ต้องการแสดงผล
    let contentToDisplay = '';
    
    if (viewType === 'pretty-print') {
        // สำหรับ Pretty Print ให้คัดลอกเนื้อหาจาก <code>
        contentToDisplay = activeView.querySelector('code') ? activeView.querySelector('code').innerHTML : activeView.querySelector('pre').innerHTML;
        modalTitle.textContent = 'JSON Pretty Print (เต็มจอ)';
        
        // สำหรับ Pretty Print ใน Modal ให้ใช้ <pre><code> ธรรมดา
        modalContent.innerHTML = `<pre class="formatted-json-output modal-output"><code>${contentToDisplay}</code></pre>`;

    } else if (viewType === 'tree-view') {
        // สำหรับ Tree View ให้คัดลอกโครงสร้าง HTML ของ Tree View ทั้งหมด
        contentToDisplay = activeView.innerHTML;
        modalTitle.textContent = 'JSON Tree View (เต็มจอ)';
        
        // สำหรับ Tree View ใน Modal ให้คัดลอกโครงสร้าง Tree View เดิมมา
        modalContent.innerHTML = contentToDisplay;
        
        // ต้องเพิ่ม Event Listener สำหรับ toggleNode ใหม่ เพราะเป็น DOM ใหม่
        modalContent.querySelectorAll('.collapse-icon').forEach(icon => {
            icon.onclick = function() {
                toggleNode(this);
            };
        });
    }

    // 3. แสดง Modal และล็อค Scroll ของ Body
    modal.style.display = 'block';
    document.body.classList.add('modal-open'); 
}

/**
 * ปิด Modal
 */
function closeModal() {
    const modal = document.getElementById('fullScreenModal');
    modal.style.display = 'none';
    
    // ปลดล็อค Scroll ของ Body
    document.body.classList.remove('modal-open'); 

    document.getElementById('modalContent').innerHTML = '';
}

// ปิด Modal เมื่อคลิกนอก Modal
window.onclick = function(event) {
    const modal = document.getElementById('fullScreenModal');
    if (event.target === modal) {
        closeModal();
    }
}

// const sampleJSON = {
//     "name": "JSON Formatter Demo",
//     "version": "1.0.0",
//     "features": [
//       "Format JSON",
//       "Validate JSON",
//       "Tree View",
//       "Dark Mode"
//     ],
//     "settings": {
//         "indentation": 2,
//         "theme": "dark/light"
//     },
//     "history": [1, 2, 3],
//     "isActive": true,
//     "currentDate": new Date().toISOString()
// };

const jsonInput = document.getElementById('jsonInputFormatter');
if (jsonInput) {
    jsonInput.value = JSON.stringify(sampleJSON, null, 2);
}

function showTab(idx, type, btn) {
  const output = document.getElementById(`json-output-${idx}`);
  output.innerHTML = type === 'tree' ? jsonHistory[idx].tree : escapeHtml(jsonHistory[idx][type]);
  
  const tabs = btn.parentElement.querySelectorAll('button');
  tabs.forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function copyText(idx) {
  const activeTab = document.querySelector(`#json-output-${idx}`).parentElement.querySelector('.tab-btn.active').textContent;
  const content = activeTab === 'Tree View' 
    ? document.querySelector(`#json-output-${idx}`).innerText
    : document.querySelector(`#json-output-${idx}`).textContent;
    
  navigator.clipboard.writeText(content).then(() => {
    showNotification('📋 Copied to clipboard!', 'success');
  }).catch(() => {
    showNotification('Failed to copy', 'error');
  });
}

function downloadText(idx) {
  const activeTab = document.querySelector(`#json-output-${idx}`).parentElement.querySelector('.tab-btn.active').textContent;
  const content = activeTab === 'Tree View' 
    ? document.querySelector(`#json-output-${idx}`).innerText
    : document.querySelector(`#json-output-${idx}`).textContent;
    
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `json_${idx + 1}_${activeTab.toLowerCase().replace(' ', '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('📁 File downloaded!', 'success');
}



function toggleTheme() {
  const body = document.body;
  const themeBtn = document.querySelector('.theme-toggle');
  
  body.classList.toggle('dark-mode');
  themeBtn.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
  
  // Save theme preference
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme');
  const themeBtn = document.querySelector('.theme-toggle');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeBtn.textContent = '☀️';
  }
  
  // Add sample JSON for demonstration
  const sampleJSON = {
    "name": "JSON Formatter Demo",
    "version": "1.0.0",
    "features": [
      "Format JSON",
      "Validate JSON",
      "Tree View",
      "Dark Mode"
    ],
    "settings": {
      "theme": "auto",
      "notifications": true
    }
  };
  
  // Uncomment to add sample data
  // document.getElementById('jsonInputFormatter').value = JSON.stringify(sampleJSON, null, 2);
});

// ใน js/myscripts.js (เพิ่มฟังก์ชันใหม่ในส่วน PRODUCTIONR FUNCTIONS)

// **********************************************
// ********** PRODUCTIONR FUNCTIONS ***********
// **********************************************

// ฟังก์ชันสร้าง UUID v4 (ดัดแปลงให้ความยาวรวมกับ 'Posttest-' เท่ากับ 27 อักขระ)
function uuidv4() {
    return 'xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, 
            // v = c == 'x' ? r : (r & 0x3 | 0x8); // v4 standard
            // ปรับเป็นสุ่มทั้งหมดแทน (เพื่อให้ความยาวรวม 27 ตัว)
            v = r; 
        return v.toString(16);
    }).toUpperCase();
}

// 1. ฟังก์ชันสร้าง privateIdValue ในรูปแบบ Posttest-UUID
function generatePrivateIdValue() {
    // ความยาวรวม: 'Posttest-' (9 อักขระ) + UUID ส่วนที่เหลือ (18 อักขระ) = 27 อักขระ
    return 'Posttest-' + uuidv4();
}

// 2. ฟังก์ชันสร้างวันที่และเวลาปัจจุบันในรูปแบบ DD/MM/YYYY HH:mm:ss
function generateCurrentDateTime() {
    const now = new Date();

    // Helper function เพื่อเพิ่มเลขศูนย์นำหน้า
    const pad = (number) => String(number).padStart(2, '0');

    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1); // getMonth() เป็น 0-indexed
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// **********************************************
// ********** AUTO COPY FUNCTIONS ***********
// **********************************************

// ฟังก์ชันหลักที่ถูกเรียกเมื่อกดปุ่ม "🚀 สร้าง Private ID"
function generatePrivateIdValueAndCopy() {
    const privateId = generatePrivateIdValue();
    const outputElement = document.getElementById('privateIdValueOutput');
    
    outputElement.textContent = privateId;

    // คัดลอกข้อมูล
    copyToClipboard(privateId, 'สร้างและคัดลอก Private ID สำเร็จ 📋');

    // ล้างข้อมูล Date/Time เดิม
    document.getElementById('dateTimeOutput').textContent = 'รอการสร้าง...';
}

// ฟังก์ชันหลักที่ถูกเรียกเมื่อกดปุ่ม "⏰ สร้าง Date/Time"
function generateCurrentDateTimeAndCopy() {
    const dateTime = generateCurrentDateTime();
    const outputElement = document.getElementById('dateTimeOutput');
    
    outputElement.textContent = dateTime;

    // คัดลอกข้อมูล
    copyToClipboard(dateTime, 'สร้างและคัดลอกวันที่/เวลาสำเร็จ 📋');

    // ล้างข้อมูล Private ID เดิม
    document.getElementById('privateIdValueOutput').textContent = 'รอการสร้าง...';
}

// ฟังก์ชันสำหรับล้างข้อมูลในแท็บ ProductionR (เรียกใช้โดยปุ่ม 🗑️ ล้างข้อมูล)
function clearProductionData() {
    document.getElementById('privateIdValueOutput').textContent = 'รอการสร้าง...';
    document.getElementById('dateTimeOutput').textContent = 'รอการสร้าง...';
    
    if (typeof showNotification === 'function') {
        showNotification('🗑️ ล้างข้อมูล Production แล้ว', 'error');
    }
}

// *** หมายเหตุ: ตรวจสอบให้แน่ใจว่าคุณมีฟังก์ชัน copyToClipboard() ที่ทำงานได้แล้วใน myscripts.js
// ถ้าไม่มีให้เพิ่มดังนี้:
/*
function copyToClipboard(text, type = 'ข้อมูล') {
    navigator.clipboard.writeText(text).then(() => {
        showNotification(`📋 คัดลอก ${type} สำเร็จ!`, 'success');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showNotification('❌ ไม่สามารถคัดลอกได้', 'error');
    });
}
*/