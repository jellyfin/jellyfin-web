import dialogHelper from 'components/dialogHelper/dialogHelper';
import globalize from 'lib/globalize';
import template from './userpicker.template.html';

function initUsers(page, users) {
    const userSelect = page.querySelector('#selectUser');

    const userOptionsHtml = users.map(function (user) {
        return '<option value="' + user.Id + '">' + user.Name + '</option>';
    });

    userSelect.innerHTML += userOptionsHtml;
}

class UserPicker {
    show = (options) => {
        if (options.users != null) {
            options.users.then(users => {
                const dlg = dialogHelper.createDialog({
                    size: 'small',
                    removeOnClose: true,
                    scrollY: true
                });
                dlg.classList.add('ui-body-a');
                dlg.classList.add('background-theme-a');
                dlg.classList.add('formDialog');
                dlg.innerHTML = globalize.translateHtml(template);
                this.currentDialog = dlg;
                initUsers(dlg, users);
                dialogHelper.open(dlg)
                    .catch(err => {
                        console.log('[userpicker] failed to open dialog', err);
                    });

                dlg.querySelector('.btnCancel')?.addEventListener('click', () => {
                    dialogHelper.close(dlg);
                });
                dlg.querySelector('.btnCloseDialog')?.addEventListener('click', () => {
                    dialogHelper.close(dlg);
                });
                dlg.querySelector('form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    const selectedUserId = this.querySelector('#selectUser')?.value;
                    if (selectedUserId && options.callback) {
                        const selectedUser = users.find(user => user.Id == selectedUserId);
                        options.callback(selectedUser);
                    }
                });
            });
        }
    };

    close = () => {
        if (this.currentDialog) {
            dialogHelper.close(this.currentDialog);
        }
    };
}

export default UserPicker;
