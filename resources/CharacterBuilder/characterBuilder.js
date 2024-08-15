document.addEventListener('DOMContentLoaded', function() {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA2h0Y1Km5nWDGCNIBRUChtH481Q-lt8dw", //process.env.FIREBASE_API_KEY,
        authDomain: "adventurer-s-guild.firebaseapp.com", // process.env.FIREBASE_AUTH_DOMAIN,
        projectId: "adventurer-s-guild", // process.env.FIREBASE_PROJECT_ID,
        storageBucket: "adventurer-s-guild.appspot.com", //process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: "937158092711", //process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: "1:937158092711:web:a03bee6d47f0534fd9f882.env", //process.env.FIREBASE_APP_ID,
    };
    firebase.initializeApp(firebaseConfig);

    var db = firebase.firestore();

    const skillNameInput = document.getElementById('skill-name');
    const skillDescriptionInput = document.getElementById('skill-description');
    const attributeTypeSelect = document.getElementById('attribute-type');
    const resourceTypeSelect = document.getElementById('resource-type');
    const authorNameInput = document.getElementById('author-name');
    const modifierList = document.getElementById('modifier-list');
    const addModifierButton = document.getElementById('add-modifier');
    const outputName = document.getElementById('output-name');
    const outputDescription = document.getElementById('output-description');
    const outputAttribute = document.getElementById('output-attribute');
    const outputResource = document.getElementById('output-resource');
    const outputValue = document.getElementById('output-value');
    const outputCostBase = document.getElementById('output-cost-base');
    const outputAttributeCost = document.getElementById('output-attribute-cost');
    const outputResourceType = document.getElementById('output-resource-type');

    const searchInput = document.getElementById('search');
    const searchButton = document.getElementById('search-button');
    const skillsList = document.getElementById('skills-list');
    const loadSkillButton = document.getElementById('load-skill');
    const saveToLibraryButton = document.getElementById('save-to-library');
    const deleteFromLibraryButton = document.getElementById('delete-from-library');

    let modifiers = [];
    let totalValue = 0;
    let currentSkillId = null;

    addModifierButton.addEventListener('click', function() {
        addModifier();
    });

    saveToLibraryButton.addEventListener('click', function() {
        saveSkill();
    });

    deleteFromLibraryButton.addEventListener('click', function() {
        if (currentSkillId) {
            if (confirm('Are you sure you want to delete this skill? This action is permanent.')) {
                deleteSkill();
            }
        } else {
            alert('No skill selected to delete.');
        }
    });

    searchButton.addEventListener('click', function() {
        searchSkills();
    });

    loadSkillButton.addEventListener('click', function() {
        const selectedSkillId = document.querySelector('#skills-list .selected')?.dataset.id;
        if (selectedSkillId) {
            loadSkill(selectedSkillId);
        } else {
            alert('Please select a skill to load.');
        }
    });

    function addModifier() {
        const modifierDiv = document.createElement('div');
        modifierDiv.className = 'modifier';

        const modifierSelect = document.createElement('select');
        const modifierOptions = ['Number of Targets', 'Range', 'Area', 'Damage', 'Extra Effect'];
        modifierOptions.forEach(mod => {
            const opt = document.createElement('option');
            opt.value = mod;
            opt.textContent = mod;
            modifierSelect.appendChild(opt);
        });

        const pointsInput = document.createElement('input');
        pointsInput.type = 'number';
        pointsInput.value = '0';
        pointsInput.min = '0';

        modifierDiv.appendChild(modifierSelect);
        modifierDiv.appendChild(pointsInput);
        modifierList.appendChild(modifierDiv);

        const modifierObject = {
            modifierSelect,
            pointsInput
        };

        modifierSelect.addEventListener('change', function() {
            handleModifierChange(modifierObject, modifierDiv);
        });

        pointsInput.addEventListener('input', updateSkill);

        modifiers.push(modifierObject);
        updateSkill();
    }

    function handleModifierChange(modifierObject, modifierDiv) {
        const selectedModifier = modifierObject.modifierSelect.value;
        if (modifierObject.extra) {
            modifierDiv.removeChild(modifierObject.extra);
            delete modifierObject.extra;
        }

        if (selectedModifier === 'Damage') {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'modifier-extra';

            const damageTypeSelect = document.createElement('select');
            const damageTypes = ['Blunt', 'Slashing', 'Piercing', 'Nature', 'Light', 'Shadow', 'Fire', 'Water', 'Air', 'Earth'];

            damageTypes.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                damageTypeSelect.appendChild(opt);
            });

            const deliveryTypeSelect = document.createElement('select');
            const deliveryTypes = ['Direct', 'Over Time'];

            deliveryTypes.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                deliveryTypeSelect.appendChild(opt);
            });

            const damageDescription = document.createElement('textarea');
            damageDescription.placeholder = 'Describe the damage...';

            extraDiv.innerHTML = `<label>Damage Type:</label>`;
            extraDiv.appendChild(damageTypeSelect);
            extraDiv.innerHTML += `<label>Delivery Type:</label>`;
            extraDiv.appendChild(deliveryTypeSelect);
            extraDiv.innerHTML += `<label>Damage Description:</label>`;
            extraDiv.appendChild(damageDescription);

            modifierDiv.appendChild(extraDiv);
            modifierObject.extra = extraDiv;
        } else if (selectedModifier === 'Extra Effect') {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'modifier-extra';

            const effectTypeSelect = document.createElement('select');
            const effectTypes = ['Beneficial', 'Negative', 'Situational'];

            effectTypes.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                effectTypeSelect.appendChild(opt);
            });

            const effectDescription = document.createElement('textarea');
            effectDescription.placeholder = 'Describe the effect...';

            extraDiv.innerHTML = `<label>Effect Type:</label>`;
            extraDiv.appendChild(effectTypeSelect);
            extraDiv.innerHTML += `<label>Effect Description:</label>`;
            extraDiv.appendChild(effectDescription);

            modifierDiv.appendChild(extraDiv);
            modifierObject.extra = extraDiv;
        }

        updateSkill();
    }

    function updateSkill() {
        const skillName = skillNameInput.value;
        const skillDescription = skillDescriptionInput.value;
        const attributeType = attributeTypeSelect.value;
        const resourceType = resourceTypeSelect.value;
        const authorName = authorNameInput.value;

        outputName.textContent = skillName;
        outputDescription.textContent = skillDescription;
        outputAttribute.textContent = attributeType;
        outputResource.textContent = resourceType;

        let modifiersText = '';
        totalValue = 0;

        modifiers.forEach(mod => {
            const modifierName = mod.modifierSelect.value;
            const points = parseInt(mod.pointsInput.value, 10) || 0;
            let modifierDescription = `${modifierName}: ${points}`;

            if (modifierName === 'Area' || modifierName === 'Range') {
                modifierDescription += ` meters`;
            } else if (modifierName === 'Damage' && mod.extra) {
                const damageType = mod.extra.querySelector('select').value;
                const deliveryType = mod.extra.querySelectorAll('select')[1].value;
                const description = mod.extra.querySelector('textarea').value;
                modifierDescription += ` (${damageType}, ${deliveryType}): ${description}`;
            } else if (modifierName === 'Extra Effect' && mod.extra) {
                const effectType = mod.extra.querySelector('select').value;
                const description = mod.extra.querySelector('textarea').value;
                modifierDescription += ` (${effectType}): ${description}`;
            }

            modifiersText += modifierDescription + '<br>';
            totalValue += points;
        });

        outputModifiers.innerHTML = modifiersText;
        outputValue.textContent = totalValue;

        // Calculate the resource cost
        const baseCost = totalValue;  // Base cost is the total value of modifiers
        const attributeCost = Math.floor(totalValue / 2);  // Example: attribute cost is half the total value
        outputCostBase.textContent = baseCost;
        outputAttributeCost.textContent = attributeCost;
        outputResourceType.textContent = resourceType;
    }

    function saveSkill() {
        if (!skillNameInput.value || !authorNameInput.value) {
            alert('Please enter skill name and author.');
            return;
        }

        const skill = {
            name: skillNameInput.value,
            description: skillDescriptionInput.value,
            attribute: attributeTypeSelect.value,
            resource: resourceTypeSelect.value,
            author: authorNameInput.value,
            modifiers: modifiers.map(mod => ({
                modifierType: mod.modifierSelect.value,
                points: parseInt(mod.pointsInput.value, 10) || 0,
                extra: mod.extra ? {
                    type: mod.extra.querySelector('select').value,
                    description: mod.extra.querySelector('textarea').value
                } : undefined
            }))
        };

        const skillRef = db.collection('skills').doc(); // Auto-generate a new document ID

        skillRef.set(skill)
            .then(() => {
                alert('Skill saved to library!');
                clearForm();
                loadSkills(); // Refresh skill list after saving
            })
            .catch(error => {
                console.error('Error saving skill: ', error);
                alert('Error saving skill. Please try again.');
            });
    }

    function deleteSkill() {
        const skillRef = db.collection('skills').doc(currentSkillId);

        skillRef.delete()
            .then(() => {
                alert('Skill deleted from library!');
                clearForm();
                loadSkills(); // Refresh skill list after deletion
            })
            .catch(error => {
                console.error('Error deleting skill: ', error);
                alert('Error deleting skill. Please try again.');
            });
    }

    function searchSkills() {
        const query = searchInput.value.trim().toLowerCase();

        if (query === '') {
            loadSkills(); // Load all skills if search query is empty
            return;
        }

        db.collection('skills')
            .where('name', '>=', query)
            .where('name', '<=', query + '\uf8ff')
            .get()
            .then(snapshot => {
                displaySkills(snapshot.docs);
            })
            .catch(error => {
                console.error('Error searching skills: ', error);
                alert('Error searching skills. Please try again.');
            });
    }

    function loadSkills() {
        db.collection('skills')
            .orderBy('name')
            .get()
            .then(snapshot => {
                displaySkills(snapshot.docs);
            })
            .catch(error => {
                console.error('Error loading skills: ', error);
                alert('Error loading skills. Please try again.');
            });
    }

    function displaySkills(skills) {
        skillsList.innerHTML = '';
        skills.forEach(doc => {
            const skill = doc.data();
            const skillDiv = document.createElement('div');
            skillDiv.textContent = skill.name;
            skillDiv.dataset.id = doc.id;
            skillDiv.addEventListener('click', function() {
                document.querySelectorAll('#skills-list div').forEach(div => div.classList.remove('selected'));
                skillDiv.classList.add('selected');
                currentSkillId = doc.id;
            });
            skillsList.appendChild(skillDiv);
        });
    }

    function loadSkill(skillId) {
        const skillRef = db.collection('skills').doc(skillId);

        skillRef.get()
            .then(doc => {
                if (doc.exists) {
                    const skill = doc.data();
                    skillNameInput.value = skill.name;
                    skillDescriptionInput.value = skill.description;
                    attributeTypeSelect.value = skill.attribute;
                    resourceTypeSelect.value = skill.resource;
                    authorNameInput.value = skill.author;

                    modifiers.forEach(mod => {
                        modifierList.removeChild(mod.modifierSelect.parentElement);
                    });
                    modifiers = [];

                    skill.modifiers.forEach(mod => {
                        const modifierObject = addModifier();
                        modifierObject.modifierSelect.value = mod.modifierType;
                        modifierObject.pointsInput.value = mod.points;

                        if (mod.extra) {
                            if (mod.modifierType === 'Damage') {
                                const extraDiv = modifierObject.extra;
                                extraDiv.querySelector('select').value = mod.extra.type;
                                extraDiv.querySelectorAll('select')[1].value = mod.extra.deliveryType;
                                extraDiv.querySelector('textarea').value = mod.extra.description;
                            } else if (mod.modifierType === 'Extra Effect') {
                                const extraDiv = modifierObject.extra;
                                extraDiv.querySelector('select').value = mod.extra.type;
                                extraDiv.querySelector('textarea').value = mod.extra.description;
                            }
                        }
                    });

                    updateSkill();
                } else {
                    alert('Skill not found.');
                }
            })
            .catch(error => {
                console.error('Error loading skill: ', error);
                alert('Error loading skill. Please try again.');
            });
    }

    function clearForm() {
        skillNameInput.value = '';
        skillDescriptionInput.value = '';
        attributeTypeSelect.value = 'Strength';
        resourceTypeSelect.value = 'Willpower';
        authorNameInput.value = '';
        modifierList.innerHTML = '';
        modifiers = [];
        updateSkill();
    }

    loadSkills(); // Load skills on page load
});
