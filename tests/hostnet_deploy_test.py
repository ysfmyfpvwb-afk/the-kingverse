import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('hostnet', Path(__file__).parents[1] / 'scripts/hostnet_deploy.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class HostnetDeployment(unittest.TestCase):
    def test_relative_paths_work_at_root_and_under_a_mount(self):
        self.assertEqual(m.local_reference('explorer/pilot/index.html', '../../index.html#books'), 'index.html')
        self.assertEqual(m.local_reference('explorer/pilot/thread/index.html', '../?entity=wrk%3A000001'), 'explorer/pilot/index.html')
        self.assertIsNone(m.local_reference('index.html', 'https://covers.openlibrary.org/b/id/1-M.jpg'))
        with self.assertRaises(ValueError):
            m.local_reference('index.html', '/the-kingverse/index.html')
        with self.assertRaises(ValueError):
            m.local_reference('index.html', '../outside.html')

    def test_missing_assets_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'index.html').write_text('<img src="missing.webp">')
            with self.assertRaisesRegex(ValueError, 'Missing local dependency'):
                m.check_references(['index.html'], root)

    def test_release_excludes_config_backups_source_and_private_keys(self):
        files = m.public_files()
        self.assertIn('index.html', files)
        self.assertIn('assets/reading-room-background-v1.webp', files)
        self.assertIn('explorer/pilot/data/wrk-000001/index.json', files)
        self.assertTrue(all(not f.startswith(('.hostnet/', 'scripts/', 'tests/', 'deploy/')) for f in files))
        self.assertNotIn('HOSTNET.md', files)
        self.assertNotIn('AGENTS.md', files)
        self.assertTrue(all(not f.endswith(('.key', '.pem')) for f in files))

    def test_failed_backup_prevents_any_upload(self):
        with patch.object(m.subprocess, 'check_output', return_value=b''), patch.object(m, 'check'), \
             patch.object(m, 'package', return_value={}), patch.object(m, 'backup', side_effect=RuntimeError('failed backup')), \
             patch.object(m, 'run') as transfer:
            with self.assertRaisesRegex(RuntimeError, 'failed backup'):
                m.deploy({'remoteRoot': '/site/kingverse'})
            transfer.assert_not_called()

    def test_existing_server_config_prevents_upload_after_backup(self):
        with patch.object(m.subprocess, 'check_output', side_effect=[b'', '.htaccess\n']), \
             patch.object(m, 'check'), patch.object(m, 'package', return_value={}), patch.object(m, 'backup') as backup, \
             patch.object(m, 'ssh', return_value=['ssh']), patch.object(m, 'run') as transfer:
            with self.assertRaisesRegex(ValueError, 'configuration needs review'):
                m.deploy({'remoteRoot': '/site/kingverse'})
            backup.assert_called_once()
            transfer.assert_not_called()

    def test_changed_reviewed_server_config_blocks_upload(self):
        config = {'remoteRoot': '/site/kingverse', 'approvedServerConfig': {'.htaccess': 'a' * 64}}
        with patch.object(m.subprocess, 'check_output', side_effect=[b'', '.htaccess\n', 'b' * 64 + ' .htaccess\n']), \
             patch.object(m, 'check'), patch.object(m, 'package', return_value={}), patch.object(m, 'backup'), \
             patch.object(m, 'ssh', return_value=['ssh']), patch.object(m, 'run') as transfer:
            with self.assertRaisesRegex(ValueError, 'configuration has changed'):
                m.deploy(config)
            transfer.assert_not_called()

    def test_transport_keeps_host_checking_and_key_only_authentication(self):
        c = {'identityFile': '/private/key', 'knownHostsFile': '/private/known_hosts', 'port': 22, 'user': 'test'}
        options = m.ssh_options(c)
        self.assertIn('StrictHostKeyChecking=yes', options)
        self.assertIn('PasswordAuthentication=no', options)
        self.assertIn('KbdInteractiveAuthentication=no', options)
        self.assertNotIn('accept-new', options)


if __name__ == '__main__':
    unittest.main()
