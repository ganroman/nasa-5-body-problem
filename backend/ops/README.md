# Admin setup on the host (one time)

`/admin` edits the env file and the flags file as the service user; a path unit does the restart.

```bash
sudo install -d -m 700 -o agent -g agent /var/lib/cargo
sudo install -m 600 -o agent -g agent backend/flags.example.json /var/lib/cargo/flags.json
sudo install -m 600 -o agent -g agent /dev/null /var/lib/cargo/cargo.env
# ADMIN_PASSWORD=<random> into /etc/thing/credentials/CARGO_ADMIN_PASSWORD (root, 600); never in the repo
sudo install -D -m 644 backend/ops/systemd/cargo-admin.conf /etc/systemd/system/thing-cargo-api.service.d/admin.conf
sudo install -m 644 backend/ops/systemd/thing-cargo-restart.{path,service} /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now thing-cargo-restart.path && sudo systemctl restart thing-cargo-api
```
