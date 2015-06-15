// Copyright (C) 2015 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.server.git;

import com.google.common.collect.Lists;
import com.google.gerrit.extensions.registration.DynamicSet;
import com.google.gerrit.reviewdb.client.Project;
import com.google.gerrit.server.util.BouncyCastleUtil;
import com.google.inject.AbstractModule;
import com.google.inject.Inject;
import com.google.inject.Singleton;

import org.eclipse.jgit.transport.PreReceiveHookChain;
import org.eclipse.jgit.transport.ReceivePack;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SignedPushModule extends AbstractModule {
  private static final Logger log =
      LoggerFactory.getLogger(SignedPushModule.class);

  @Override
  protected void configure() {
    if (BouncyCastleUtil.havePGP()) {
      DynamicSet.bind(binder(), ReceivePackInitializer.class)
          .to(Initializer.class);
    } else {
      log.info("BouncyCastle PGP not installed; signed push verification is"
          + " disabled");
    }
  }

  @Singleton
  private static class Initializer implements ReceivePackInitializer {
    private final SignedPushPreReceiveHook hook;

    @Inject
    Initializer(SignedPushPreReceiveHook hook) {
      this.hook = hook;
    }

    @Override
    public void init(Project.NameKey project, ReceivePack rp) {
      rp.setPreReceiveHook(PreReceiveHookChain.newChain(Lists.newArrayList(
          hook, rp.getPreReceiveHook())));
    }
  }
}
