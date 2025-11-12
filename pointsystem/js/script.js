document.getElementById("banner").classList.add("hidden");

DefaultSettings = {
    "system": {
        "SystemToUse": "colors",
        "DefaultPointsSingle": 50,
        "PointsMode": "name"
    },
    "subjects_and_criteria": {
        "DefaultSubjects": [

        ],
        "DefaultCriteria": [

        ]
    },
    "colors": {
        "Colors": [
            "#ff0000",
            "#ff7f00",
            "#ffff00",
            "#007f00",
            "#0000ff",
            "#7f00ff",
            "#ff00ff"
        ]
    },
    "clips": {
        "Categories": [

        ],
        "UseColors": false,
    },
    "faces": {
        "Color": 200,
        "Steps": 5
    },
    "numbers": {
        "Minimum": 0,
        "Maximum": 100
    },
    "interface": {
        "NamesPerRow": 5,
        "Blur": false,
        "TransitionSpeed": 0.2,
        "LightMode": false,
    }
}

storage = window.localStorage;
const ErrorDialogText = document.getElementById("error-text");

if (!storage.getItem("settings")) {
    storage.setItem("settings", JSON.stringify(DefaultSettings));
    UserSettings = JSON.parse(JSON.stringify(DefaultSettings));
}
else {
    try {
        UserSettings = JSON.parse(storage.getItem("settings"));
    }
    catch (error) {
        ErrorDialogText.innerHTML = "The saved settings have been corrupted.";
        SetDialogState("error-dialog", 1, true);
    }
}

// Elements
AddEntryBtn = document.getElementById("add-entry");
const AddNameInput = document.getElementById("add-name-input");
const BannerDiv = document.getElementById("banner");
const BannerMsgSpan = document.getElementById("banner-msg");
const BannerTitleSpan = document.getElementById("banner-title");
const ChangerDiv = document.getElementById("changer");
ClipsViewDiv = document.getElementById("clips-view");
const DialogContainer = document.getElementById("dialog-container");
MainViewDiv = document.getElementById("main-view");
const MasterDiv = document.getElementById("master");
const NameListSidebar = document.getElementById("name-list-sidebar");
const NamesPerRowSlider = document.getElementById("names-per-row-slider");
const NamesPerRowValue = document.getElementById("names-per-row-value");
NameViewDiv = document.getElementById("name-view");
const NoNameSelectedText = document.getElementById("name-view").innerHTML;
const RenameNameInput = document.getElementById("rename-name-input");
const RenameNameText = document.getElementById("rename-name-text");
const RemoveNameText = document.getElementById("remove-name-text");
const SettingsColorsColors = document.getElementById("settings-colors-colors");
const SettingsDialog = document.getElementById("settings-container");
const SettingsFacesStepsPreview = document.getElementById("settings-faces-steps-preview");
const SettingsSystemDefaultPointsSingle = document.getElementById("settings-system-defaultpointssingle");
const SettingsSystemPointsMode = document.getElementById("settings-system-pointsmode");
const TopBarDiv = document.getElementById("topbar");
const TransitionSpeedStyle = document.getElementById("transition-speed-style");

// Variables
ActiveSymbolButton = null;
ChangerDivActive = false;
ChangerInitiator = null;
DBReady = false;
DBReadyAddProgressInterval = null;
DragActionDiv = null;
DragOffset = [0, 0];
DragStartPosition = null;
ColorDragStartTimeout = null;
DragTarget = null;
InputLike = ["INPUT", "TEXTAREA"];
OpenName = null;
PreDragTarget = null;
ResolveGetOpenNamePromise = null;
SelectedName = null;
SystemPickerUsed = null;
UserColorInput = null;

// Initialize IndexedDB
database = null;
async function InitializeDatabase() {
    const request = window.indexedDB.open("MainDatabase", 4);
    request.onerror = (event) => {
        ThrowBannerError("IndexedDB Unavailable", "Your data may not be saved.");
    }
    request.onsuccess = async (event) => {
        database = await event.target.result;
        DatabaseReady();
    }
    request.onupgradeneeded = async (event) => {
        db = event.target.result;
        ObjectStore = await db.createObjectStore("names", { keyPath: "name" });
        ObjectStore.createIndex("name", "name", { unique: false });
        database = db;
        index = ObjectStore.index("name");
        index.openCursor().onsuccess = (event) => {
            cursor = event.target.result;
            if (cursor) {
                cursor.value.points_single = UserSettings.system.DefaultPointsSingle;
                cursor.value.points_multiple.forEach((item) => {
                    item.points_criteria = item.points;
                    item.points = UserSettings.system.DefaultPointsSingle;
                })
                cursor.continue();
            }
        }
        DatabaseReady();
    }
}
InitializeDatabase();

// Update user settings
Object.keys(DefaultSettings).forEach((category) => {
    if (typeof (UserSettings[category]) == "undefined") {
        UserSettings[category] = DefaultSettings[category];
        storage.setItem("settings", JSON.stringify(UserSettings));
    }
    Object.keys(DefaultSettings[category]).forEach((setting) => {
        if (typeof (UserSettings[category][setting]) == "undefined") {
            UserSettings[category][setting] = DefaultSettings[category][setting];
            storage.setItem("settings", JSON.stringify(UserSettings));
        }
    })
})


// Update settings pages
SettingsSystemDefaultPointsSingle.parentNode.querySelector(".slider-value").innerHTML = UserSettings.system.DefaultPointsSingle + "%";
SettingsSystemDefaultPointsSingle.value = UserSettings.system.DefaultPointsSingle;
["colors", "clips", "faces", "numbers"].forEach((item, i) => {
    if (UserSettings.system.SystemToUse == item) {
        RadioSelect(document.getElementById("settings-system-systemtouse").querySelectorAll(".radio-item")[i]);
    }
})
document.getElementById("settings-faces-color").value = UserSettings.faces.Color;
document.getElementById("settings-faces-color").parentNode.querySelector("div").innerHTML = UserSettings.faces.Color;
document.getElementById("settings-faces-steps").value = UserSettings.faces.Steps;
document.getElementById("settings-faces-steps").parentNode.querySelector("div").innerHTML = UserSettings.faces.Steps;
document.getElementById("settings-interface-transitionspeed").value = UserSettings.interface.TransitionSpeed;
document.getElementById("settings-interface-transitionspeed").parentNode.querySelector("div").innerHTML = UserSettings.interface.TransitionSpeed;


// Apply user settings (if not done elsewhere)
document.getElementById("face-color").innerHTML = ".face { background-color: hsl(" + UserSettings.faces.Color + ", 100%, 50%) }";
criteria = UserSettings.subjects_and_criteria.DefaultCriteria.join("\n");
subjects = UserSettings.subjects_and_criteria.DefaultSubjects.join("\n");

document.getElementById("criteria-input").value = criteria;
document.getElementById("subjects-input").value = subjects;
document.getElementById("add-name-criteria").placeholder = criteria;
document.getElementById("edit-name-criteria").placeholder = criteria;
document.getElementById("add-name-subjects").placeholder = subjects;
document.getElementById("edit-name-subjects").placeholder = subjects;
document.getElementById("clips-categories-input").value = UserSettings.clips.Categories.join("\n");
document.getElementById("settings-numbers-min").value = UserSettings.numbers.Minimum;
document.getElementById("settings-numbers-max").value = UserSettings.numbers.Maximum;

if (UserSettings.clips.UseColors) {
    document.getElementById("settings-clips-usecolors").classList.add("active");
}

if (UserSettings.interface.Blur) {
    document.getElementById("transparency").innerHTML = `
        .ui {
            background-color: var(--ui-color-50);
            backdrop-filter: blur(0.15625rem);
        }
    `;
}

if (UserSettings.interface.LightMode) {
    document.getElementById("settings-interface-lightmode").classList.add("active");
    document.getElementById("light-mode-style").innerHTML = `
        :root {
            --text-color: #000;
            --text-color-secondary: #4f4f4f;
            --ui-color: #fff;
            --ui-color-25: rgba(255, 255, 255, 0.25);
            --ui-color-50: rgba(255, 255, 255, 0.50);
            --ui-color-75: rgba(255, 255, 255, 0.75);
        }

        .invertable-icon {
            filter: invert(100%);
        }
    `;
}

TransitionSpeedStyle.innerHTML = ":root { --transition-speed: " + UserSettings.interface.TransitionSpeed + "s; }";


// Event listeners
window.onclick = (event) => {
    if (ChangerDivActive && document.activeElement.tagName != "INPUT") {
        ChangerDiv.classList.remove("active");
        ChangerDivActive = false;
    }
}

window.onmousemove = (event) => {
    if (DragTarget) {
        DragMove(event.clientX, event.clientY);
    }
}

window.onmouseup = (event) => {
    if (DragTarget) {
        DragStop(event.clientX, event.clientY);
    }
}

AddNameInput.onkeydown = (event) => {
    if (event.key == "Enter") {
        AddName();
    }
}

document.getElementById("clips-categories-input").oninput = () => {
    document.getElementById("apply-categories-btn-container").classList.add("visible");
}

SettingsSystemDefaultPointsSingle.oninput = (event) => {
    event.currentTarget.parentNode.querySelector("div").innerHTML = event.currentTarget.value + "%";
    UserSettings.system.DefaultPointsSingle = event.currentTarget.value;
    storage.setItem("settings", JSON.stringify(UserSettings));
}

document.querySelectorAll(".slider-value-container>input").forEach((item) => {
    item.addEventListener("input", (event) => {
        SliderValueDiv = event.currentTarget.parentNode.querySelector("div");
        SliderValueDiv.innerHTML = event.currentTarget.value + SliderValueDiv.dataset.suffix;
    });
})


NamesPerRowSlider.oninput = (event) => {
    NamesPerRowValue.innerHTML = event.currentTarget.value;
    MainViewDiv.style.gridTemplateColumns = "repeat(" + event.currentTarget.value + ", 1fr)";
    UserSettings.interface.NamesPerRow = event.currentTarget.value;
    storage.setItem("settings", JSON.stringify(UserSettings));
}

NamesPerRowSlider.parentNode.onclick = (event) => {
    NamesPerRowSlider.parentNode.classList.add("expanded");
}

NamesPerRowSlider.onmouseleave = (event) => {
    NamesPerRowSlider.parentNode.classList.remove("expanded");
    NamesPerRowSlider.blur();
}

document.querySelectorAll(".radio-item").forEach((item) => {
    item.addEventListener("click", (event) => {
        RadioSelect(event.currentTarget);
    })
})

RenameNameInput.onkeydown = (event) => {
    if (event.key == "Enter") {
        RenameName();
    }
}

document.getElementById("settings-numbers-min").oninput = (event) => {
    if (event.currentTarget.value.length) {
        UserSettings.numbers.Minimum = parseInt(event.currentTarget.value);
    }
    else {
        UserSettings.numbers.Minimum = 0;
    }
    storage.setItem("settings", JSON.stringify(UserSettings));
    if (UserSettings.system.SystemToUse == "numbers") {
        UpdateChanger();
        if (UserSettings.system.PointsMode == "name") {
            UpdateNameList();
        }
        else if (SelectedName) {
            ViewNamePoints(SelectedName);
        }
    }
}

document.getElementById("settings-numbers-max").oninput = (event) => {
    if (event.currentTarget.value.length) {
        UserSettings.numbers.Maximum = parseInt(event.currentTarget.value);
    }
    else {
        UserSettings.numbers.Maximum = 100;
    }
    storage.setItem("settings", JSON.stringify(UserSettings));
    if (UserSettings.system.SystemToUse == "numbers") {
        UpdateChanger();
        if (UserSettings.system.PointsMode == "name") {
            UpdateNameList();
        }
        else if (SelectedName) {
            ViewNamePoints(SelectedName);
        }
    }
}

document.getElementById("settings-faces-color").oninput = (event) => {
    document.getElementById("face-color").innerHTML = ".face { background-color: hsl(" + event.currentTarget.value + ", 100%, 50%) }";
    UserSettings.faces.Color = event.currentTarget.value;
    storage.setItem("settings", JSON.stringify(UserSettings));
}

document.getElementById("settings-faces-steps").oninput = (event) => {
    UpdateFacesPreview(event.currentTarget.value);
    UpdateChanger();
}

document.getElementById("settings-clips-usecolors").onclick = ((event) => {
    if (event.currentTarget.classList.contains("active")) {
        UserSettings.clips.UseColors = false;
        storage.setItem("settings", JSON.stringify(UserSettings));
        event.currentTarget.classList.remove("active");
    }
    else {
        UserSettings.clips.UseColors = true;
        storage.setItem("settings", JSON.stringify(UserSettings));
        event.currentTarget.classList.add("active");
    }
    if (UserSettings.system.SystemToUse == "clips") {
        UpdateClipsView();
    }
})

document.getElementById("settings-interface-blur").onclick = ((event) => {
    if (event.currentTarget.classList.contains("active")) {
        UserSettings.interface.Blur = false;
        storage.setItem("settings", JSON.stringify(UserSettings));
        event.currentTarget.classList.remove("active");
        document.getElementById("transparency").innerHTML = "";
    }
    else {
        UserSettings.interface.Blur = true;
        storage.setItem("settings", JSON.stringify(UserSettings));
        event.currentTarget.classList.add("active");
        document.getElementById("transparency").innerHTML = `
            .ui {
                background-color: var(--ui-color-50);
                backdrop-filter: blur(0.15625rem);
            }
        `;
    }
})

document.getElementById("settings-interface-lightmode").onclick = ((event) => {
    if (event.currentTarget.classList.contains("active")) {
        UserSettings.interface.LightMode = false;
        storage.setItem("settings", JSON.stringify(UserSettings));
        event.currentTarget.classList.remove("active");
        document.getElementById("light-mode-style").innerHTML = "";
    }
    else {
        UserSettings.interface.LightMode = true;
        storage.setItem("settings", JSON.stringify(UserSettings));
        event.currentTarget.classList.add("active");
        document.getElementById("light-mode-style").innerHTML = `
            :root {
                --text-color: #000;
                --text-color-secondary: #4f4f4f;
                --ui-color: #fff;
                --ui-color-25: rgba(255, 255, 255, 0.25);
                --ui-color-50: rgba(255, 255, 255, 0.50);
                --ui-color-75: rgba(255, 255, 255, 0.75);
            }

            .invertable-icon {
                filter: invert(100%);
            }
        `;
    }
})

document.getElementById("settings-interface-transitionspeed").oninput = (event) => {
    UserSettings.interface.TransitionSpeed = event.currentTarget.value;
    TransitionSpeedStyle.innerHTML = ":root { --transition-speed: " + UserSettings.interface.TransitionSpeed + "s; }";
    storage.setItem("settings", JSON.stringify(UserSettings));
}

document.getElementById("settings-system-systemtouse").querySelectorAll(".radio-item").forEach((item) => {
    item.onclick = (event) => {
        UserSettings.system.SystemToUse = event.currentTarget.innerHTML.toLowerCase();
        storage.setItem("settings", JSON.stringify(UserSettings));
        UpdateChanger();
        if (UserSettings.system.SystemToUse == "clips") {
            document.getElementById("by-name-toolbar").classList.remove("active");
            document.getElementById("by-subject-toolbar").classList.remove("active");
            document.getElementById("clips-toolbar").classList.add("active");
            UpdateClipsView();
            document.querySelectorAll(".bar-mid-section").forEach((item) => {
                item.classList.remove("active");
            })
            document.getElementById("clips-toolbar").classList.add("active");
        }
        else if (UserSettings.system.PointsMode == "name") {
            UpdateNameList();
            document.getElementById("clips-toolbar").classList.remove("active");
            document.getElementById("by-name-toolbar").classList.add("active");
        }
        else {
            document.getElementById("by-name-toolbar").classList.remove("active");
            document.getElementById("by-subject-toolbar").classList.add("active");
            document.getElementById("clips-toolbar").classList.remove("active");

            if (SelectedName) {
                ViewNamePoints(SelectedName);
            }

            document.getElementById("main-view").classList.add("hidden");
            document.getElementById("name-view").classList.remove("hidden");
            if (document.getElementById("clips-view")) {
                document.getElementById("clips-view").classList.add("hidden");
            }
            else if (document.getElementById("no-categories")) {
                document.getElementById("no-categories").remove();
            }
        }
    }
})

document.getElementById("criteria-input").oninput = (event) => {
    UserSettings.subjects_and_criteria.DefaultCriteria = event.currentTarget.value.split("\n");
    storage.setItem("settings", JSON.stringify(UserSettings));
    document.getElementById("add-name-criteria").placeholder = event.currentTarget.value;
    document.getElementById("edit-name-criteria").placeholder = event.currentTarget.value;
}

document.getElementById("subjects-input").oninput = (event) => {
    UserSettings.subjects_and_criteria.DefaultSubjects = event.currentTarget.value.split("\n");
    storage.setItem("settings", JSON.stringify(UserSettings));
    document.getElementById("add-name-subjects").placeholder = event.currentTarget.value;
    document.getElementById("edit-name-subjects").placeholder = event.currentTarget.value;
}

// Keyboard shortcuts
document.onkeydown = (event) => {
    if (!InputLike.includes(document.activeElement.tagName) && event.shiftKey) {
        if (event.key.toLowerCase() == "a") {
            SetDialogState("add-name-dialog", 1, true);
            AddNameInput.value = "";
        }
        if (event.key.toLowerCase() == "l") {
            if (UserSettings.system.PointsMode != "name") {
                SetNameListSidebarState(1);
            }
        }
    }
    else if (event.key == "Escape") {
        if (document.querySelector(".dialog.visible")) {
            SetDialogState("*");
        }
        if (document.querySelector("#name-list-sidebar-container.active")) {
            SetNameListSidebarState(0);
        }
        if (ChangerDivActive) {
            ChangerDiv.classList.remove("active");
            ChangerDivActive = false;
            document.activeElement.blur();
        }
    }
    else if (event.key == "Tab") {
        if (event.shiftKey) {
            if (document.activeElement.classList.contains("first-item")) {
                event.preventDefault();
                CurrentNode = document.activeElement;
                while (!CurrentNode.querySelector(".last-item")) {
                    CurrentNode = CurrentNode.parentNode;
                }
                CurrentNode.querySelector(".last-item").focus();
            }
        }
        else {
            if (document.activeElement.classList.contains("last-item")) {
                event.preventDefault();
                CurrentNode = document.activeElement;
                while (!CurrentNode.querySelector(".first-item")) {
                    CurrentNode = CurrentNode.parentNode;
                }
                CurrentNode.querySelector(".first-item").focus();
            }
        }
    }
}

// Functions
function ActivateSettingsPage(pageid) {
    found = false;
    document.querySelectorAll(".settings-page").forEach((item) => {
        if (item.id == pageid + "-settings-page") {
            found = true;
            item.classList.remove("fade-up");
            item.classList.remove("fade-down");
            return;
        }
        if (found) {
            item.classList.add("fade-down");
            item.classList.remove("fade-up");
        }
        else {
            item.classList.add("fade-up");
            item.classList.remove("fade-down");
        }
    })
}
ActivateSettingsPage("system");

function AddColor() {
    UserSettings.colors.Colors.push("#fff");
    storage.setItem("settings", JSON.stringify(UserSettings));
    UpdateColorEditor();
    UpdateColors();
    UpdateNameList();
}

function AddName(name = AddNameInput.value, dry = false) {
    HighestNumber = 0;
    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    index = ObjectStore.index("name");
    index.openCursor().onsuccess = (event) => {
        cursor = event.target.result;
        if (cursor) {
            if (cursor.value.name == name) {
                HighestNumber = 1;
                item_new = JSON.parse(JSON.stringify(cursor.value));
                item_new.name = name + " 1";
                ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
                ObjectStore.delete(cursor.value.name);
                ObjectStore.put(item_new);
            }
            else if (cursor.value.name.startsWith(name + " ")) {
                HighestNumber = parseInt(cursor.value.name.substring(cursor.value.name.indexOf(" ") + 1));
            }
            cursor.continue();
        }
        else {
            ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
            HighestNumber ? NameToAdd = name + " " + (HighestNumber + 1) : NameToAdd = name;
            if (dry) {
                OpenName = NameToAdd;
                ResolveGetOpenNamePromise();
            }
            else {
                PointsMultiple = [];
                AddNameCriteriaValue = document.getElementById("add-name-criteria").value;
                if (AddNameCriteriaValue.length) {
                    CriteriaToAssign = AddNameCriteriaValue.split("\n");
                }
                else {
                    CriteriaToAssign = UserSettings.subjects_and_criteria.DefaultCriteria;
                }
                UserSettings.subjects_and_criteria.DefaultSubjects.forEach((item) => {
                    PointsMultiple.push({ "subject": item, "points": UserSettings.system.DefaultPointsSingle, "points_criteria": new Array(UserSettings.subjects_and_criteria.DefaultCriteria.length).fill(UserSettings.system.DefaultPointsSingle) });
                })
                ObjectStore.add({ "name": NameToAdd, "points_single": UserSettings.system.DefaultPointsSingle, "criteria": CriteriaToAssign, "points_multiple": PointsMultiple });
                if (UserSettings.system.SystemToUse == "clips") {
                    UpdateClipsView();
                }
                else if (UserSettings.system.PointsMode == "name") {
                    UpdateNameList();
                }
                SetDialogState("add-name-dialog", 0);
            }
        }
    }
}

function AddProgress(p) {
    SplashBarProgress = parseInt(document.getElementById("splash-prog").innerHTML) + parseInt(p);
    if (SplashBarProgress >= 100) {
        SplashBarProgress = 100;
        PageLoaded = true;
        setTimeout(() => {
            document.body.style.backgroundImage = "url(" + sources[0] + ")";
            FadeSplash();
        }, 200);
    }
    SplashBar.style.width = SplashBarProgress + "%";
    document.getElementById("splash-prog").innerHTML = SplashBarProgress + "%";
}

function ApplyClipsTiers() {
    UserSettings.clips.Categories = document.getElementById("clips-categories-input").value.split("\n");
    storage.setItem("settings", JSON.stringify(UserSettings));
    document.getElementById("apply-categories-btn-container").classList.remove("visible");
    if (UserSettings.system.SystemToUse == "clips") {
        UpdateClipsView();
    }
}

function ApplyNewSubjects() {
    ChangeNameSubjectCriteria();
    SetDialogState("edit-name-dialog", 0);
}

function AskForColor(event) {
    ActiveSymbolButton = event.currentTarget;
    promise = new Promise((resolve, reject) => {
        SystemPickerUsed = resolve;
    }).then(() => {
        ActiveSymbolButton.style.backgroundColor = UserColorInput;
        UserSettings.colors.Colors[parseInt(ActiveSymbolButton.dataset.index)] = UserColorInput;
        storage.setItem("settings", JSON.stringify(UserSettings));
        UpdateChanger();
        UpdateNameList();
    });
    SpawnSystemColorPicker();
}

function ChangeNameSubjectCriteria() {
    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    ObjectStore.get(SelectedName).onsuccess = (event) => {
        OldSubjects = [];
        NewSubjects = [];
        event.target.result.points_multiple.forEach((item) => {
            OldSubjects.push(item.subject);
        })
        if (document.getElementById("edit-name-subjects").value.length) {
            NewSubjects = document.getElementById("edit-name-subjects").value.split("\n");
        }
        else {
            NewSubjects = UserSettings.subjects_and_criteria.DefaultSubjects;
        }
        NewerSubjects = [...NewSubjects];
        NewSubjects.forEach((item) => {
            count = 0;
            NewSubjects.forEach((jtem, j) => {
                if (item.localeCompare(jtem) == 0) {
                    count++;
                    NewerSubjects[j] = jtem + " " + count;
                }
            })
            if (count >= 2) {
                NewSubjects = [...NewerSubjects];
            }
            else {
                NewerSubjects = [...NewSubjects];
            }
        })
        OldSubjects.reverse().forEach((item, i) => {
            ri = (OldSubjects.length - 1) - i;
            if (!NewSubjects.includes(item)) {
                event.target.result.points_multiple = event.target.result.points_multiple.slice(0, ri).concat(event.target.result.points_multiple.slice(ri + 1));
            }
        })
        NewSubjects.forEach((item) => {
            if (!OldSubjects.includes(item)) {
                event.target.result.points_multiple.push({ "subject": item, "points": UserSettings.system.DefaultPointsSingle, "points_criteria": new Array(UserSettings.subjects_and_criteria.DefaultCriteria.length).fill(UserSettings.system.DefaultPointsSingle) });
            }
        })
        if (document.getElementById("edit-name-criteria").value.length) {
            NewCriteria = document.getElementById("edit-name-criteria").value.split("\n");
        }
        else {
            NewCriteria = UserSettings.subjects_and_criteria.DefaultCriteria;
        }
        event.target.result.criteria = NewCriteria;
        ObjectStore.put(event.target.result);
        ViewNamePoints(SelectedName);
    }
}

function ChangePointMulti(element, single = true) {
    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    ObjectStore.get(SelectedName).onsuccess = (event) => {
        event.target.result.points_multiple.forEach((item) => {
            if (item.subject == ChangerInitiator.parentNode.querySelectorAll("td")[0].innerHTML) {
                if (UserSettings.system.SystemToUse == "numbers") {
                    ValueToSet = element.value;
                }
                else {
                    ValueToSet = element.dataset.point_value;
                }
                if (single) {
                    item.points = (ValueToSet - UserSettings.numbers.Minimum) * (100 / (UserSettings.numbers.Maximum - UserSettings.numbers.Minimum));
                }
                else {
                    ChangerInitiator.parentNode.querySelectorAll("td").forEach((jtem, j) => {
                        if (jtem == ChangerInitiator) {
                            item.points_criteria[j - 1] = (ValueToSet - UserSettings.numbers.Minimum) * (100 / (UserSettings.numbers.Maximum - UserSettings.numbers.Minimum));
                        }
                    })
                }
                ObjectStore.put(event.target.result);
            }
        })
        if (UserSettings.system.SystemToUse == "colors") {
            ChangerInitiator.style.backgroundColor = element.style.backgroundColor;
        }
        else if (UserSettings.system.SystemToUse == "faces") {
            SetFacialExpression(ChangerInitiator.querySelector(".face>.mouth"), element.dataset.point_value);
        }
        else if (UserSettings.system.SystemToUse == "numbers") {
            ChangerInitiator.innerHTML = element.value;
        }
    }
}

function ChangePointSingle(name, initiator) {
    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    ObjectStore.get(name).onsuccess = (event) => {
        if (UserSettings.system.SystemToUse != "numbers") {
            event.target.result.points_single = initiator.dataset.point_value;
        }
        else {
            event.target.result.points_single = (initiator.value - UserSettings.numbers.Minimum) * (100 / (UserSettings.numbers.Maximum - UserSettings.numbers.Minimum));
        }
        ObjectStore.put(event.target.result);
        document.querySelectorAll(".name").forEach((item) => {
            if (item.innerHTML == name) {
                if (UserSettings.system.SystemToUse == "colors") {
                    item.parentNode.querySelector(".color").style.backgroundColor = initiator.style.backgroundColor;
                }
                else if (UserSettings.system.SystemToUse == "faces") {
                    SetFacialExpression(item.parentNode.querySelector(".face>.mouth"), parseInt(initiator.dataset.point_value));
                }
                else if (UserSettings.system.SystemToUse == "numbers") {
                    item.parentNode.querySelector(".number").innerHTML = initiator.value;
                }
            }
        })
    }
}

function ColorDragStart(element, offset_x, offset_y) {
    DragTarget = element;
    DragTarget.classList.add("dragging");
    DragOffset = [offset_x, offset_y];
    rect = DragTarget.getBoundingClientRect();
    DragStartPosition = [rect.left - offset_x, rect.top - offset_y];
    DragTarget.onclick = null;
    DragActionDiv = DragTarget.parentNode.parentNode.querySelector(".drag-action");
    PreviousDragActionText = DragActionDiv.innerHTML;
    DragActionDiv.innerHTML = "Drag here and release to delete";
}

function CreateFace() {
    face = document.createElement("div");
    face.classList.add("face");

    LeftEye = document.createElement("div");
    LeftEye.classList.add("left", "eye");
    pupil = document.createElement("pupil");
    pupil.classList.add("pupil");
    LeftEye.appendChild(pupil);
    face.appendChild(LeftEye);

    RightEye = document.createElement("div");
    RightEye.classList.add("right", "eye");
    pupil = document.createElement("pupil");
    pupil.classList.add("pupil");
    RightEye.appendChild(pupil);
    face.appendChild(RightEye);

    mouth = document.createElement("div");
    mouth.classList.add("mouth");
    face.appendChild(mouth);

    return face;
}

function CreateNameElement(name, value, parent) {
    entry = document.createElement("button");
    entry.classList.add("ui", "entry");

    if (UserSettings.system.SystemToUse == "colors") {
        color = document.createElement("div");
        color.classList.add("color");
        color.style.backgroundColor = UserSettings.colors.Colors[Math.round((UserSettings.colors.Colors.length - 1) * (value / 100))];
        entry.appendChild(color);
    }
    else if (UserSettings.system.SystemToUse == "faces") {
        entry.appendChild(CreateFace());
        SetFacialExpression(mouth, value);
    }
    else if (UserSettings.system.SystemToUse == "numbers") {
        number = document.createElement("div");
        number.classList.add("number");
        number.innerHTML = Math.round((parseInt(value) * ((UserSettings.numbers.Maximum - UserSettings.numbers.Minimum) / 100)) + UserSettings.numbers.Minimum);
        entry.appendChild(number);
    }
    label = document.createElement("div");
    label.classList.add("name");
    label.innerHTML = name;
    entry.appendChild(label);

    // When a name is clicked
    entry.onclick = (event) => {
        if (event.clientX == 0 && event.clientY == 0) {
            OpenChanger({ currentTarget: event.currentTarget, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
            ChangerDiv.querySelector("input, button").focus();
        }
        else {
            OpenChanger(event);
        }
    }

    if (parent) {
        parent.insertBefore(entry, AddEntryBtn);
    }
    else {
        return entry;
    }
}

DBReadyIntervalTimesRun = 0;
function DatabaseReady() {
    DBReady = true;
    database.onerror = (event) => {
        console.error(`${event.target.error?.message}`);
        ErrorDialogText.innerHTML = `${event.target.error?.message}`;
        SetDialogState("error-dialog", 1, true);
    }
    if (!DBReadyAddProgressInterval) {
        DBReadyAddProgressInterval = setInterval(() => {
            DBReadyIntervalTimesRun++;
            if (UserSettings.system.SystemToUse != "clips" && UserSettings.system.PointsMode == "name") {
                UpdateNameList();
            }
            AddProgress(80);
            if (parseInt(document.getElementById("splash-prog").innerHTML) >= 100) {
                clearInterval(DBReadyAddProgressInterval);
            }
            if (DBReadyIntervalTimesRun >= 20) {
                SplashBar.style.width = "100%";
                document.getElementById("splash-prog").innerHTML = "100%";
                document.body.style.backgroundImage = "url(" + sources[0] + ")";
                document.getElementById("splash").style.opacity = 0;
                setTimeout(() => {
                    document.getElementById("splash").style.display = "none";
                    document.getElementById("master").style.opacity = 1;
                    document.getElementById("master").style.transform = "scale(1)";
                }, 1500);
            }
        }, 100);
    }
    UpdateNameListSidebar();
    if (UserSettings.system.SystemToUse == "clips") {
        UpdateClipsView();
    }
}

function DragMove(mousex, mousey) {
    DragTarget.style.transform = "translateX(" + (mousex - DragStartPosition[0]) + "px)";
    if (DragActionDiv) {
        if (mousey > DragActionDiv.getBoundingClientRect().top) {
            DragTarget.style.transform += "translateY(1rem)";
            DragTarget.style.opacity = 0.5;
        }
        else {
            DragTarget.style.opacity = 1;
        }
    }
    else {
        DragTarget.style.transform += "translateY(" + (mousey - DragStartPosition[1]) + "px)";
        ClipsViewDiv.querySelectorAll("th, td").forEach((item) => {
            rect = item.getBoundingClientRect();
            if (mousex >= rect.left && mousex <= rect.left + rect.width) {
                item.style.opacity = 1;
            }
            else {
                item.style.opacity = 0.5;
            }
        })
    }
}

function DragStop(mousex, mousey) {
    if (DragActionDiv && mousey > DragActionDiv.getBoundingClientRect().top) {
        index = parseInt(DragTarget.dataset.index);
        UserSettings.colors.Colors = UserSettings.colors.Colors.slice(0, index).concat(UserSettings.colors.Colors.slice(index + 1));
        storage.setItem("settings", JSON.stringify(UserSettings));
        DragTarget.remove();
        DragActionDiv.innerHTML = PreviousDragActionText;
        DragActionDiv = null;
        ColorDragStartTimeout = null;
        DragTarget = null;
        return;
    }
    inserted = false;
    if (DragTarget.style.backgroundColor) {
        SettingsColorsColors.querySelectorAll("button").forEach((item, i) => {
            if (inserted) {
                return;
            }
            if (item != DragTarget && (item.getBoundingClientRect().left > DragTarget.getBoundingClientRect().left || i == SettingsColorsColors.childElementCount - 1)) {
                inserted = true;
                SettingsColorsColors.insertBefore(DragTarget, item);
                UpdateColors();
                UpdateColorEditor();
                UpdateNameList();
                DragTarget.classList.remove("dragging");
                DragTarget.style.transform = "";
                setTimeout(() => {
                    PostDragTarget.onclick = (event) => {
                        AskForColor(event);
                    }
                }, 250);
                PostDragTarget = DragTarget;
                DragActionDiv.innerHTML = PreviousDragActionText;
                DragActionDiv = null;
                DragTarget = null;
            }
        })
        UpdateChanger();
    }
    else {
        StopAfterDropZoneCheck = false;
        rect = document.getElementById("rename-drop-zone").getBoundingClientRect();
        if (mousex >= rect.left && mousex <= rect.left + rect.width && mousey >= rect.top && mousey <= rect.top + rect.height) {
            StopAfterDropZoneCheck = true;
            SelectedName = DragTarget.innerHTML;
            RenameNameText.innerHTML = "Rename <span class='bold'>" + SelectedName + "</span>";
            SetDialogState("rename-name-dialog", 1);
            DragTarget.style.transform = "";
            DragTarget = null;
        }
        else {
            rect = document.getElementById("remove-drop-zone").getBoundingClientRect();
            if (mousex >= rect.left && mousex <= rect.left + rect.width && mousey >= rect.top && mousey <= rect.top + rect.height) {
                StopAfterDropZoneCheck = true;
                SelectedName = DragTarget.innerHTML;
                RemoveNameText.innerHTML = "Remove <span class='bold'>" + SelectedName + "</span> from the list?";
                SetDialogState("remove-name-dialog", 1);
                DragTarget.style.transform = "";
                DragTarget = null;
            }
        }
        ClipsViewDiv.querySelectorAll("th, td").forEach((item) => {
            item.style.opacity = 1;
        })
        document.getElementById("clips-toolbar").querySelectorAll("button, div").forEach((item) => {
            if (item.classList.contains("hidden")) {
                item.classList.remove("hidden");
            }
            else {
                item.classList.add("hidden");
            }
        })
        if (StopAfterDropZoneCheck) {
            return;
        }
        ClipsViewDiv.querySelectorAll("td").forEach((item, i) => {
            rect = item.getBoundingClientRect();
            if (mousex >= rect.left && mousex <= rect.left + rect.width) {
                item.appendChild(DragTarget);
                ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
                ObjectStore.get(DragTarget.innerHTML).onsuccess = (event) => {
                    event.target.result.points_single = 100 - (100 * i / (UserSettings.clips.Categories.length - 1));
                    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
                    ObjectStore.put(event.target.result);
                    ClipsViewDiv.querySelectorAll("th, td").forEach((item) => {
                        if (item.tagName == "TD") {
                            ColumnElements = [];
                            item.querySelectorAll("div").forEach((jtem) => {
                                ColumnElements.push(jtem.innerHTML);
                            })
                            ColumnElements = ColumnElements.sort();
                            item.querySelectorAll("div").forEach((jtem, j) => {
                                jtem.innerHTML = ColumnElements[j];
                            })
                        }
                    })
                }
                DragTarget.style.transform = "";
                DragTarget = null;
            }
        })
    }
}

function ExportData() {
    DataToDownload = {
        "IndexedDB": [

        ],
        "UserSettings": {

        }
    };

    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    index = ObjectStore.index("name");
    index.openCursor().onsuccess = (event) => {
        cursor = event.target.result;
        if (cursor) {
            DataToDownload.IndexedDB.push({ "key": cursor.key, "value": cursor.value });
            cursor.continue();
        }
        else {
            DataToDownload.UserSettings = UserSettings;
            element = document.createElement('a');
            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(DataToDownload)));
            element.setAttribute("download", "UserData.json");
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    }

}

function FadeSplash() {
    document.getElementById("splash").style.opacity = 0;
    setTimeout(() => {
        document.getElementById("splash").style.display = "none";
        document.getElementById("master").style.opacity = 1;
        document.getElementById("master").style.transform = "scale(1)";
    }, 1500);
}

async function ImportData() {
    if (document.getElementById("import-data-file-input").files[0]) {
        file = document.getElementById("import-data-file-input").files[0];
    }
    else {
        [FileHandle] = await window.showOpenFilePicker({ types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }] });
        file = await FileHandle.getFile();
    }
    reader = new FileReader();
    reader.onloadend = () => {
        try {
            JSONFromFile = JSON.parse(reader.result);
        }
        catch (error) {
            ErrorDialogText.innerHTML = "Invalid data file. Please check and/or repair the file contents.";
            SetDialogState("error-dialog", 1, true);
        }
        database.transaction(["names"], "readwrite").objectStore("names").clear();
        ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
        JSONFromFile.IndexedDB.forEach((item) => {
            ObjectStore.add(item.value);
        })
        UserSettings = JSONFromFile.UserSettings;
        storage.setItem("settings", JSON.stringify(UserSettings));
        location.reload();
    }
    reader.readAsBinaryString(file);
}

function NameDragStart(element, offset_x, offset_y) {
    document.getElementById("clips-toolbar").querySelectorAll("button, div").forEach((item) => {
        if (item.classList.contains("hidden")) {
            item.classList.remove("hidden");
        }
        else {
            item.classList.add("hidden");
        }
    })
    DragTarget = element;
    DragTarget.classList.add("dragging");
    DragOffset = [offset_x, offset_y];
    rect = DragTarget.getBoundingClientRect();
    DragStartPosition = [rect.left - offset_x, rect.top - offset_y];
    DragTargetIndex = null;
    ClipsViewDiv.querySelectorAll("td").forEach((item, i) => {
        if (item == element.parentNode) {
            DragTargetIndex = i;
        }
    })
    ClipsViewDiv.querySelectorAll("th, td").forEach((item, i) => {
        if (i % UserSettings.clips.Categories.length == DragTargetIndex) {
            item.style.opacity = 1;
        }
        else {
            item.style.opacity = 0.5;
        }
    })
}


function OpenChanger(event) {
    ChangerInitiator = event.currentTarget;
    if (!ChangerDiv.classList.contains("active")) {
        ChangerDiv.style.left = "calc(" + event.clientX + "px - 5rem)";
        ChangerDiv.style.top = "calc(" + event.clientY + "px - 5rem)";
    }
    if ((ChangerDiv.offsetLeft + ChangerDiv.offsetWidth) > window.innerWidth) {
        ChangerDiv.style.left = "calc(" + window.innerWidth + "px - 10rem)";
    }
    if (ChangerDiv.offsetLeft < 0) {
        ChangerDiv.style.left = "0px";
    }
    ChangerDiv.classList.add("active");
    if (ChangerInitiator.querySelector(".name")) {
        SelectedName = ChangerInitiator.querySelector(".name").innerHTML;
        if (ChangerInitiator.querySelector(".number")) {
            ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
            ObjectStore.get(SelectedName).onsuccess = (event) => {
                ChangerDiv.querySelector("input").value = parseInt(ChangerInitiator.querySelector(".number").innerHTML);
                ChangerDiv.querySelectorAll("div")[2].innerHTML = parseInt(ChangerInitiator.querySelector(".number").innerHTML);
            }
        }
    }
    else if (UserSettings.system.SystemToUse == "numbers") {
        ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
        ObjectStore.get(SelectedName).onsuccess = (event) => {
            ChangerDiv.querySelector("input").value = parseInt(ChangerInitiator.innerHTML);
            ChangerDiv.querySelectorAll("div")[2].innerHTML = parseInt(ChangerInitiator.innerHTML);
        }
    }
    setTimeout(() => {
        if (ChangerDiv.classList.contains("active")) {
            ChangerDivActive = true;
        }
    }, 150);
}

function RadioSelect(element) {
    RadioHighlight = element.parentNode.querySelector(".radio-highlight");
    RadioHighlight.style.top = (element.getBoundingClientRect().top - element.parentNode.getBoundingClientRect().top) + "px";
    RadioHighlight.style.height = (element.getBoundingClientRect().height - element.parentNode.getBoundingClientRect().height) + "px";
}

function RenameName() {
    const GetOpenNamePromise = new Promise((resolve, reject) => {
        ResolveGetOpenNamePromise = resolve;
    }).then(() => {
        ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
        ObjectStore.get(SelectedName).onsuccess = (event) => {
            ObjectStore.delete(event.target.result.name);
            event.target.result.name = OpenName;
            SelectedName = OpenName;
            ObjectStore.put(event.target.result);
            if (UserSettings.system.SystemToUse == "clips") {
                UpdateClipsView();
            }
            else if (UserSettings.system.PointsMode == "name") {
                UpdateNameList();
            }
            else if (UserSettings.system.PointsMode == "subject") {
                ViewNamePoints(SelectedName);
            }
        }
        SetDialogState("rename-name-dialog", 0);
    })
    AddName(RenameNameInput.value, true);
}

function RemoveName() {
    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    ObjectStore.delete(SelectedName).onsuccess = () => {
        if (UserSettings.system.SystemToUse == "clips") {
            UpdateClipsView();
        }
        else if (UserSettings.system.PointsMode == "name") {
            UpdateNameList();
        }
        else if (UserSettings.system.PointsMode == "subject") {
            NameViewDiv.innerHTML = NoNameSelectedText;
        }
        SetDialogState("remove-name-dialog", 0);
    }
}

function ScrollMasterToTop() {
    document.getElementById("master").scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth"
    });
}

function SetDialogState(id, state, exclusive = false) {
    if (id == "*") {
        document.querySelectorAll(".dialog").forEach((item) => {
            SetDialogState(item.id, 0);
        })
        return;
    }
    if (state) {
        wait = 0;
        if (exclusive && document.querySelector(".dialog.visible")) {
            wait = 350;
            document.querySelectorAll(".dialog").forEach((item) => {
                SetDialogState(item.id, 0);
            })
        }
        setTimeout(() => {
            document.getElementById(id).classList.add("visible");
            DialogContainer.classList.add("active");
            ElementToFocus = document.getElementById(id).querySelector(".dialog-inner>button, .dialog-inner>input, .dialog-inner>div>textarea, button:last-child")
            if (ElementToFocus) {
                ElementToFocus.focus();
            }
        }, wait);
    }
    else {
        DialogContainer.classList.remove("active");
        setTimeout(() => {
            document.getElementById(id).classList.remove("visible");
        }, 300);
    }
}

function SetFacialExpression(element, value) {
    steps = 20;
    ClipPath = "polygon(";
    scale = 0.8 + (value / 500);
    if (value < 50) {
        value = 100 - value;
        element.style.transform = "scaleY(-1) translateY(-40%)"
    }
    else {
        element.style.transform = ""
    }
    element.style.transform += " scale(" + scale + ")";
    if (value <= 100 && value >= 50) {
        for (i = 0; i <= steps; i++) {
            ClipPath += ", " + (40 * (Math.cos(i * Math.PI / steps) + 1) + 10) + "% " + ((0.8 * (value - 50) * Math.sin(i * Math.PI / steps)) + (0.3 * (100 - value) + 50)) + "%";
        }
        for (i = steps; i >= 0; i--) {
            ClipPath += ", " + (50 * (Math.cos(i * Math.PI / steps) + 1)) + "% " + ((1 * (value - 50) * Math.sin(i * Math.PI / steps)) + (0.3 * (100 - value) + 50 + (0.2 * (100 - value)))) + "%";
        }
    }
    ClipPath = ClipPath.replace("(, ", "(") + ")";
    element.style.clipPath = ClipPath;
}

function SetNameListSidebarState(state) {
    if (DBReady) {
        UpdateNameListSidebar();
    }
    if (state) {
        NameListSidebar.parentNode.classList.add("active");
        NameListSidebar.querySelector("button").focus();
    }
    else {
        NameListSidebar.parentNode.classList.remove("active");
    }
}

function SetPointsMode(mode) {
    UserSettings.system.PointsMode = mode;
    storage.setItem("settings", JSON.stringify(UserSettings));
    if (UserSettings.system.SystemToUse == "clips") {
        return;
    }
    document.querySelectorAll(".bar-mid-section").forEach((item) => {
        item.classList.remove("active");
    })
    switch (mode) {
        case "name":
            RadioSelect(SettingsSystemPointsMode.querySelectorAll(".radio-item")[0]);
            document.getElementById("by-name-toolbar").classList.add("active");
            document.getElementById("main-view").classList.remove("hidden");
            document.getElementById("name-view").classList.add("hidden");
            try {
                UpdateNameList();
            }
            catch (error) { };
            break;
        case "subject":
            RadioSelect(SettingsSystemPointsMode.querySelectorAll(".radio-item")[1]);
            document.getElementById("by-subject-toolbar").classList.add("active");
            document.getElementById("main-view").classList.add("hidden");
            document.getElementById("name-view").classList.remove("hidden");
            if (SelectedName) {
                ViewNamePoints(SelectedName);
            }
            break;
        case "criteria":
            RadioSelect(SettingsSystemPointsMode.querySelectorAll(".radio-item")[2]);
            document.getElementById("by-subject-toolbar").classList.add("active");
            document.getElementById("main-view").classList.add("hidden");
            document.getElementById("name-view").classList.remove("hidden");
            if (SelectedName) {
                ViewNamePoints(SelectedName);
            }
            break;
    }
}
SetPointsMode(UserSettings.system.PointsMode);

function SetSettingsDialogState(state) {
    if (state) {
        SettingsDialog.classList.add("visible");
    }
    else {
        SettingsDialog.classList.remove("visible");
    }
}

function SpawnSystemColorPicker() {
    input = document.createElement("input");
    input.type = "color";
    input.oninput = (event) => {
        UserColorInput = event.currentTarget.value;
        SystemPickerUsed();
    }
    input.click();
}

function ThrowBannerError(title, msg) {
    BannerTitleSpan.innerHTML = title;
    BannerMsgSpan.innerHTML = msg;
    BannerDiv.classList.remove("hidden");
}

function ToggleReach() {
    if (MasterDiv.classList.contains("reach")) {
        MasterDiv.classList.remove("reach");
        TopBarDiv.classList.remove("reach");
    }
    else {
        MasterDiv.classList.add("reach");
        TopBarDiv.classList.add("reach");
    }
}

function UpdateChanger(mode = "single") {
    ChangerDiv.innerHTML = "";
    if (UserSettings.system.SystemToUse == "colors") {
        length = UserSettings.colors.Colors.length;
        UserSettings.colors.Colors.forEach((item, i) => {
            container = document.createElement("div");
            container.classList.add("changer-circle-container");
            container.style.transform = "rotateZ(" + (i / (length + 2) * 360) + "deg)";
            circle = document.createElement("button");
            circle.classList.add("changer-circle")
            circle.style.backgroundColor = item;
            circle.style.transform = "rotateZ(" + (-360 * (i / (length + 2))) + "deg)";
            circle.dataset.point_value = 100 * (i / (length - 1));
            if (mode == "name" || mode == "single") {
                circle.onclick = (event) => {
                    ChangePointSingle(SelectedName, event.currentTarget);
                }
            }
            else if (mode == "subject") {
                circle.onclick = (event) => {
                    ChangePointMulti(event.currentTarget);
                }
            }
            else if (mode == "criteria") {
                circle.onclick = (event) => {
                    ChangePointMulti(event.currentTarget, false);
                }
            }
            container.appendChild(circle);
            ChangerDiv.appendChild(container);
        })
    }
    else if (UserSettings.system.SystemToUse == "faces") {
        length = UserSettings.faces.Steps;
        for (i = 0; i < length; i++) {
            container = document.createElement("div");
            container.classList.add("changer-circle-container");
            container.style.transform = "rotateZ(" + (360 * (i / (length + 2))) + "deg)";
            circle = CreateFace();
            circle.classList.add("changer-circle");
            circle.style.transform = "rotateZ(" + (-360 * (i / (length + 2))) + "deg)";
            circle.dataset.point_value = 100 * (i / (length - 1));
            if (mode == "name" || mode == "single") {
                circle.onclick = (event) => {
                    ChangePointSingle(SelectedName, event.currentTarget);
                }
            }
            else if (mode == "multi" || mode == "subject") {
                circle.onclick = (event) => {
                    ChangePointMulti(event.currentTarget);
                }
            }
            else if (mode == "criteria") {
                circle.onclick = (event) => {
                    ChangePointMulti(event.currentTarget, false);
                }
            }
            container.appendChild(circle);
            ChangerDiv.appendChild(container);
        }
        document.querySelectorAll(".changer-circle").forEach((item) => {
            SetFacialExpression(item.querySelector(".mouth"), item.dataset.point_value);
        })
    }
    else if (UserSettings.system.SystemToUse == "numbers") {
        container = document.createElement("div");
        container.classList.add("number-changer");
        container.classList.add("ui");
        slider = document.createElement("div");
        input = document.createElement("input");
        input.type = "range";
        input.min = UserSettings.numbers.Minimum;
        input.max = UserSettings.numbers.Maximum;
        input.oninput = (event) => {
            event.currentTarget.parentNode.nextSibling.innerHTML = event.currentTarget.value;
        }
        slider.appendChild(input);
        container.appendChild(slider);
        number = document.createElement("div");
        number.innerHTML = "Num";
        container.appendChild(number);
        remove = document.createElement("button");
        remove.onclick = (event) => {
            RemoveNameText.innerHTML = "Remove <span class='bold'>" + SelectedName + "</span> from the list?";
            SetDialogState("remove-name-dialog", 1);
        }
        img = document.createElement("img");
        img.src = "img/icons/remove.png";
        remove.appendChild(img);
        container.appendChild(remove);
        rename = document.createElement("button");
        rename.onclick = (event) => {
            RenameNameText.innerHTML = "Rename <span class='bold'>" + SelectedName + "</span>";
            SetDialogState("rename-name-dialog", 1);
        }
        img = document.createElement("img");
        img.src = "img/icons/rename.png";
        img.classList.add("invertable-icon");
        rename.appendChild(img);
        container.appendChild(rename);
        check = document.createElement("button");
        img = document.createElement("img");
        img.classList.add("invertable-icon");
        img.src = "img/icons/check.png";
        check.appendChild(img);
        check.onclick = (event) => {
            if (UserSettings.system.PointsMode == "name") {
                ChangePointSingle(SelectedName, event.currentTarget.parentNode.querySelector("input"));
            }
            else if (UserSettings.system.PointsMode == "subject") {
                ChangePointMulti(event.currentTarget.parentNode.querySelector("input"));
            }
            else if (UserSettings.system.PointsMode == "criteria") {
                ChangePointMulti(event.currentTarget.parentNode.querySelector("input"), false);
            }
        }
        container.appendChild(check);
        ChangerDiv.appendChild(container);
        return;
    }
    for (i = 0; i < 2; i++) {
        container = document.createElement("div");
        container.classList.add("changer-circle-container");
        container.style.transform = "rotateZ(" + ((length + i) / (length + 2) * 360) + "deg)";
        circle = document.createElement("button");
        circle.classList.add("changer-circle", "ui");
        circle.style.transform = "rotateZ(" + ((length + i) / (length + 2) * -360) + "deg)";
        icon = document.createElement("img");
        if (i == 0) {
            icon.src = "img/icons/rename.png";
            icon.classList.add("invertable-icon");
            circle.onclick = () => {
                RenameNameText.innerHTML = "Rename <span class='bold'>" + SelectedName + "</span>";
                SetDialogState("rename-name-dialog", 1);
                ChangerDiv.classList.remove("active");
                ChangerDivActive = false;
            }
        }
        else if (i == 1) {
            icon.src = "img/icons/remove.png";
            circle.onclick = () => {
                RemoveNameText.innerHTML = "Remove <span class='bold'>" + SelectedName + "</span> from the list?";
                SetDialogState("remove-name-dialog", 1);
                ChangerDiv.classList.remove("active");
                ChangerDivActive = false;
            }
        }
        circle.appendChild(icon);
        container.appendChild(circle);
        ChangerDiv.appendChild(container);
    }
}
UpdateChanger();

function UpdateClipsView() {
    if (!document.getElementById("clips-toolbar").classList.contains("active")) {
        document.querySelectorAll(".bar-mid-section").forEach((item) => {
            item.classList.remove("active");
        })
        document.getElementById("clips-toolbar").classList.add("active");
    }
    if (UserSettings.clips.Categories.length == 0 || (UserSettings.clips.Categories.length == 1 && !UserSettings.clips.Categories[0].length)) {
        NoCategoriesDiv = document.createElement("div");
        NoCategoriesDiv.classList.add("ui");
        NoCategoriesDiv.id = "no-categories";
        NoCategoriesLine = document.createElement("div");
        NoCategoriesLine.classList.add("bold");
        NoCategoriesLine.innerHTML = "No Tiers Specified";
        NoCategoriesDiv.appendChild(NoCategoriesLine);
        NoCategoriesLine = document.createElement("div");
        NoCategoriesLine.innerHTML = "Specify a list of tiers under Settings > Clips.";
        NoCategoriesDiv.appendChild(NoCategoriesLine);
        document.getElementById("main-view").classList.add("hidden");
        document.getElementById("name-view").classList.add("hidden");
        ClipsViewDiv.remove();
        MasterDiv.appendChild(NoCategoriesDiv);
        return;
    }
    else {
        if (document.getElementById("no-categories")) {
            document.getElementById("no-categories").remove();
        }
    }
    ClipsViewBuffer = document.createElement("table");
    ClipsViewBuffer.classList.add("ui");
    row = document.createElement("tr");
    UserSettings.clips.Categories.forEach((item, i) => {
        header = document.createElement("th");
        header.width = (100 / UserSettings.clips.Categories.length) + "%";
        if (UserSettings.clips.UseColors) {
            color = UserSettings.colors.Colors[Math.round((UserSettings.colors.Colors.length - 1) - (i * (UserSettings.colors.Colors.length / UserSettings.clips.Categories.length)))];
            ColorR = parseInt(color.substring(color.indexOf("(") + 1, color.indexOf(", ")));
            ColorG = parseInt(color.substring(color.indexOf(", ") + 2, color.indexOf(", ", color.indexOf(", ") + 2)));
            ColorB = parseInt(color.substring(color.indexOf(", ", color.indexOf(", ") + 2) + 2, color.indexOf(")")));
            if ((0.2126 * ColorR + 0.7152 * ColorG + 0.0722 * ColorB) <= 127.5) {
                header.style.color = "#fff";
            }
            else {
                header.style.color = "#000";
            }
            header.style.backgroundColor = color;
        }
        header.innerHTML = item;
        row.appendChild(header);
    })
    ClipsViewBuffer.appendChild(row);

    row = document.createElement("tr");
    UserSettings.clips.Categories.forEach((item) => {
        td = document.createElement("td");
        row.appendChild(td);
    })

    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    index = ObjectStore.index("name");
    index.openCursor().onsuccess = (event) => {
        cursor = event.target.result;
        if (cursor) {
            label = document.createElement("div");
            label.innerHTML = cursor.value.name;
            label.onmousedown = (event) => {
                rect = event.currentTarget.getBoundingClientRect();
                NameDragStart(event.currentTarget, rect.left - event.clientX, rect.top - event.clientY);
            }
            row.querySelectorAll("td")[Math.round((UserSettings.clips.Categories.length - 1) * ((100 - cursor.value.points_single) / 100))].appendChild(label);
            cursor.continue();
        }
    }
    ClipsViewBuffer.appendChild(row);

    ClipsViewBuffer.id = "clips-view";
    document.getElementById("main-view").classList.add("hidden");
    document.getElementById("name-view").classList.add("hidden");
    MasterDiv.appendChild(ClipsViewBuffer);
    ClipsViewDiv.remove();
    ClipsViewDiv = ClipsViewBuffer;
}

function UpdateColors() {
    UserSettings.colors.Colors = [];
    Array.from(SettingsColorsColors.children).forEach((item, i) => {
        if (i >= SettingsColorsColors.children.length - 1) {
            return;
        }
        UserSettings.colors.Colors.push(item.style.backgroundColor);
    })
    storage.setItem("settings", JSON.stringify(UserSettings));
}

function UpdateColorEditor() {
    SettingsColorsColors.innerHTML = "";
    UserSettings.colors.Colors.forEach((item, i) => {
        button = document.createElement("button");
        button.style.backgroundColor = item;
        button.dataset.index = i;
        button.onclick = ((event) => {
            AskForColor(event);
        })
        button.onmousedown = (event) => {
            PreDragTarget = event.currentTarget;
            if (!ColorDragStartTimeout) {
                ColorDragStartTimeout = setTimeout(() => {
                    ColorDragStart(PreDragTarget, PreDragTarget.getBoundingClientRect().left - event.clientX, 0);
                }, 500);
            }
        }
        button.onmouseup = () => {
            if (ColorDragStartTimeout) {
                clearTimeout(ColorDragStartTimeout);
                ColorDragStartTimeout = null;
            }
        }
        number = document.createElement("div");
        number.classList.add("points-conversion");
        number.innerHTML = Math.round(100 * (i / UserSettings.colors.Colors.length)) + "-" + Math.round(100 * ((i + 1) / UserSettings.colors.Colors.length)) + "%";
        button.appendChild(number);
        SettingsColorsColors.appendChild(button);
    })
    button = document.createElement("button");
    button.classList.add("ui");
    button.innerHTML = "+";
    button.onclick = () => {
        AddColor();
    }
    SettingsColorsColors.appendChild(button);
}
UpdateColorEditor();

function UpdateFacesPreview(value) {
    SettingsFacesStepsPreview.innerHTML = "";
    SettingsFacesStepsPreview.style.aspectRatio = value;
    for (step = 0; step < value; step++) {
        face = CreateFace();
        SetFacialExpression(face.querySelector(".mouth"), 100 * (step / (value - 1)));
        PointsConversion = document.createElement("div");
        PointsConversion.classList.add("points-conversion");
        PointsConversion.innerHTML = Math.round(100 * (step / value)) + "-" + Math.round(100 * ((step + 1) / value)) + "%";
        face.appendChild(PointsConversion);
        SettingsFacesStepsPreview.appendChild(face);
    }
    UserSettings.faces.Steps = parseInt(value);
    storage.setItem("settings", JSON.stringify(UserSettings));
}
UpdateFacesPreview(UserSettings.faces.Steps);

function UpdateNameList() {
    MainViewBuffer = document.createElement("div");
    MainViewContent = MainViewDiv.innerHTML;
    AddNameBtnString = MainViewContent.substring(MainViewContent.indexOf("<button"), MainViewContent.indexOf("</button>") + 9);
    AddEntryBtn = document.getElementById("add-entry");
    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    index = ObjectStore.index("name");
    NamesPerRowSlider.max = 0;
    NameListSidebar.innerHTML = "";
    index.openCursor().onsuccess = (event) => {
        cursor = event.target.result;
        if (cursor) {
            MainViewBuffer.appendChild(CreateNameElement(cursor.value.name, cursor.value.points_single));
            cursor.continue();
            NamesPerRowSlider.max++;
        }
        else {
            document.getElementById("name-view").classList.add("hidden");
            if (document.getElementById("clips-view")) {
                document.getElementById("clips-view").classList.add("hidden");
            }
            else if (document.getElementById("no-categories")) {
                document.getElementById("no-categories").remove();
            }
            MainViewBuffer.appendChild(AddEntryBtn);
            MainViewDiv.remove();
            MainViewBuffer.id = "main-view";
            MainViewDiv = MainViewBuffer;
            MainViewDiv.style.gridTemplateColumns = "repeat(" + UserSettings.interface.NamesPerRow + ", 1fr)";
            MasterDiv.appendChild(MainViewBuffer);
            NamesPerRowSlider.min = 1;
            if (NamesPerRowSlider.max < 5) {
                NamesPerRowSlider.max = 5;
            }
            NamesPerRowSlider.value = UserSettings.interface.NamesPerRow;
            NamesPerRowValue.innerHTML = UserSettings.interface.NamesPerRow;
        }
    }
}

function UpdateNameListSidebar() {
    NameListSidebar.innerHTML = "";
    header = document.createElement("div");
    header.id = "name-list-sidebar-header";
    button = document.createElement("button");
    button.classList.add("first-item");
    button.innerHTML = "X";
    button.onclick = () => {
        SetNameListSidebarState(0);
    }
    header.appendChild(button);
    title = document.createElement("div");
    title.classList.add("bold");
    title.innerHTML = "Select a Name";
    header.appendChild(title);
    NameListSidebar.appendChild(header);
    ObjectStore = database.transaction(["names"], "readwrite").objectStore("names");
    index = ObjectStore.index("name");
    index.openCursor().onsuccess = (event) => {
        cursor = event.target.result;
        if (cursor) {
            button = document.createElement("button");
            button.innerHTML = cursor.value.name;
            button.onclick = (event) => {
                ViewNamePoints(event.currentTarget.innerHTML);
                SetNameListSidebarState(0);
            }
            NameListSidebar.appendChild(button);
            cursor.continue();
        }
        else {
            button = document.createElement("button");
            button.classList.add("last-item");
            button.style.textAlign = "center";
            button.innerHTML = "Add New";
            button.onclick = () => {
                SetNameListSidebarState(0);
                SetDialogState('add-name-dialog', 1);
            }
            NameListSidebar.appendChild(button);
        }
    }
}

function ViewNamePoints(name) {
    SelectedName = name;
    database.transaction(["names"], "readwrite").objectStore("names").get(name).onsuccess = (event) => {
        NameViewBuffer = document.createElement("table");
        NameViewBuffer.classList.add("ui");
        row = document.createElement("tr");
        title = document.createElement("th");
        title.classList.add("bold");
        if (UserSettings.system.PointsMode == "subject") {
            title.colSpan = 2;
        }
        NameDiv = document.createElement("div");
        NameDiv.innerHTML = name;
        title.appendChild(NameDiv);
        button = document.createElement("button");
        img = document.createElement("img");
        img.src = "img/icons/rename.png";
        img.classList.add("invertable-icon");
        button.appendChild(img);
        button.style.marginLeft = "0.5rem";
        button.onclick = () => {
            RenameNameText.innerHTML = "Rename <span class='bold'>" + SelectedName + "</span>";
            SetDialogState("rename-name-dialog", 1);
        }
        title.appendChild(button);
        button = document.createElement("button");
        img = document.createElement("img");
        img.src = "img/icons/remove.png";
        button.appendChild(img);
        button.onclick = () => {
            RemoveNameText.innerHTML = "Remove <span class='bold'>" + SelectedName + "</span> from the list?";
            SetDialogState("remove-name-dialog", 1);
        }
        title.appendChild(button);
        row.appendChild(title);
        if (event.target.result.points_multiple.length == 0 || (event.target.result.points_multiple.length == 1 && !event.target.result.points_multiple[0].length)) {
            NameViewBuffer.appendChild(row);
            row = document.createElement("tr");
            row.id = "no-subjects";
            td = document.createElement("td");
            td.innerHTML = "This name has no subjects.";
            row.appendChild(td);
            NameViewBuffer.appendChild(row);
            NameViewDiv.remove();
            NameViewBuffer.id = "name-view";
            NameViewDiv = NameViewBuffer;
            MasterDiv.appendChild(NameViewDiv);
            MainViewDiv.classList.add("hidden");
            NameViewDiv.classList.remove("hidden");
            return;
        }
        if (UserSettings.system.PointsMode == "criteria") {
            event.target.result.criteria.forEach((item) => {
                CriteriaHeader = document.createElement("th");
                CriteriaHeader.classList.add("bold");
                CriteriaHeader.innerHTML = item;
                row.appendChild(CriteriaHeader);
            })
        }
        NameViewBuffer.appendChild(row);
        SkipLoop = false;
        event.target.result.points_multiple.forEach((item) => {
            if (SkipLoop) {
                return;
            }
            if (UserSettings.system.PointsMode == "criteria") {
                PointCellsToAdd = item.points_criteria.length;
            }
            else {
                PointCellsToAdd = 1;
            }
            if (PointCellsToAdd == 0) {
                SkipLoop = true;
                row = document.createElement("tr");
                row.id = "no-subjects";
                td = document.createElement("td");
                td.innerHTML = "This name has no criteria.";
                row.appendChild(td);
                NameViewBuffer.appendChild(row);
                return;
            }
            row = document.createElement("tr");
            subject = document.createElement("td");
            subject.innerHTML = item.subject;
            row.appendChild(subject);
            for (j = 0; j < PointCellsToAdd; j++) {
                points = document.createElement("td");
                if (PointCellsToAdd > 1) {
                    ValueToSet = item.points_criteria[j];
                }
                else {
                    ValueToSet = item.points;
                }
                if (UserSettings.system.SystemToUse == "colors") {
                    points.style.backgroundColor = UserSettings.colors.Colors[Math.round((UserSettings.colors.Colors.length - 1) * (ValueToSet / 100))];
                }
                else if (UserSettings.system.SystemToUse == "faces") {
                    face = CreateFace();
                    SetFacialExpression(face.querySelector(".mouth"), ValueToSet);
                    points.appendChild(face);
                }
                else if (UserSettings.system.SystemToUse == "numbers") {
                    points.innerHTML = Math.round((ValueToSet * ((UserSettings.numbers.Maximum - UserSettings.numbers.Minimum) / 100)) + UserSettings.numbers.Minimum);
                }
                points.onclick = (event) => {
                    OpenChanger(event);
                }
                row.appendChild(points);
            }
            NameViewBuffer.appendChild(row);
        })
        NameViewDiv.remove();
        NameViewBuffer.id = "name-view";
        NameViewDiv = NameViewBuffer;
        MasterDiv.appendChild(NameViewDiv);
        MainViewDiv.classList.add("hidden");
        NameViewDiv.classList.remove("hidden");
    }
    if (UserSettings.system.PointsMode == "criteria") {
        UpdateChanger(UserSettings.system.PointsMode);
    }
    else {
        UpdateChanger(UserSettings.system.PointsMode);
    }
}
